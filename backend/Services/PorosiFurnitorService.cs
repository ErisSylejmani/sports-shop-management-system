using backend.Contracts.PorosiFurnitori;
using backend.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public sealed class PorosiFurnitorService(AppDbContext db)
{
    public async Task<(PorosiFurnitorDetailResponse? Response, string? Error, int StatusCode)> CreateAsync(
        CreatePorosiFurnitorRequest request,
        CancellationToken cancellationToken = default)
    {
        var statusi = request.Statusi.Trim();
        if (statusi.Length == 0)
            return (null, "Statusi është i detyrueshëm.", StatusCodes.Status400BadRequest);

        if (request.Detajet.Count == 0)
            return (null, "Porosia duhet të ketë të paktën një rresht produkti.", StatusCodes.Status400BadRequest);

        var validation = await ValidateLinesAndFurnitorAsync(
            request.FurnitorId,
            request.Detajet,
            cancellationToken);
        if (validation.Error is not null)
            return (null, validation.Error, validation.StatusCode);

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var porosiId = Guid.NewGuid();
                var (detajet, shumaTotale) = BuildDetajEntities(porosiId, validation.Produktet!, request.Detajet);

                var porosi = new PorosiFurnitori
                {
                    PorosiId = porosiId,
                    FurnitorId = request.FurnitorId,
                    DataPorosise = request.DataPorosise ?? DateTime.UtcNow,
                    DataPritshme = request.DataPritshme,
                    ShumaTotale = shumaTotale,
                    Statusi = statusi
                };

                db.PorositFurnitoreve.Add(porosi);
                db.DetajetPorosiveFurnitor.AddRange(detajet);

                await db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);

                var response = await BuildDetailResponseAsync(porosiId, cancellationToken);
                return (response, (string?)null, StatusCodes.Status201Created);
            }
            catch
            {
                await tx.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    public async Task<(PorosiFurnitorDetailResponse? Response, string? Error, int StatusCode)> UpdateAsync(
        Guid porosiId,
        UpdatePorosiFurnitorRequest request,
        CancellationToken cancellationToken = default)
    {
        var statusi = request.Statusi.Trim();
        if (statusi.Length == 0)
            return (null, "Statusi është i detyrueshëm.", StatusCodes.Status400BadRequest);

        if (request.Detajet.Count == 0)
            return (null, "Porosia duhet të ketë të paktën një rresht produkti.", StatusCodes.Status400BadRequest);

        var porosi = await db.PorositFurnitoreve
            .Include(p => p.Detajet)
            .FirstOrDefaultAsync(p => p.PorosiId == porosiId, cancellationToken);

        if (porosi is null)
            return (null, "Porosia nuk u gjet.", StatusCodes.Status404NotFound);

        var validation = await ValidateLinesAndFurnitorAsync(
            request.FurnitorId,
            request.Detajet,
            cancellationToken);
        if (validation.Error is not null)
            return (null, validation.Error, validation.StatusCode);

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                db.DetajetPorosiveFurnitor.RemoveRange(porosi.Detajet);

                var (detajet, shumaTotale) = BuildDetajEntities(porosiId, validation.Produktet!, request.Detajet);

                porosi.FurnitorId = request.FurnitorId;
                porosi.DataPorosise = request.DataPorosise;
                porosi.DataPritshme = request.DataPritshme;
                porosi.ShumaTotale = shumaTotale;
                porosi.Statusi = statusi;

                db.DetajetPorosiveFurnitor.AddRange(detajet);

                await db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);

                var response = await BuildDetailResponseAsync(porosiId, cancellationToken);
                return (response, (string?)null, StatusCodes.Status200OK);
            }
            catch
            {
                await tx.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    public async Task<PorosiFurnitorDetailResponse?> GetDetailAsync(
        Guid porosiId,
        CancellationToken cancellationToken = default) =>
        await BuildDetailResponseAsync(porosiId, cancellationToken);

    private async Task<PorosiFurnitorDetailResponse?> BuildDetailResponseAsync(
        Guid porosiId,
        CancellationToken cancellationToken)
    {
        var row = await (
            from p in db.PorositFurnitoreve.AsNoTracking()
            join f in db.Furnitoret.AsNoTracking() on p.FurnitorId equals f.FurnitorId
            where p.PorosiId == porosiId
            select new { Porosi = p, f.Emri }).FirstOrDefaultAsync(cancellationToken);

        if (row is null)
            return null;

        var detajet = await (
            from d in db.DetajetPorosiveFurnitor.AsNoTracking()
            join pr in db.Produktet.AsNoTracking() on d.ProduktId equals pr.ProduktId
            where d.PorosiId == porosiId
            orderby pr.Emri
            select new PorosiFurnitorDetajResponse(
                d.DetajPorosiId,
                d.ProduktId,
                pr.Emri,
                d.Sasia,
                d.CmimiNjesi,
                d.CmimiTotal)).ToListAsync(cancellationToken);

        return new PorosiFurnitorDetailResponse(
            row.Porosi.PorosiId,
            row.Porosi.FurnitorId,
            row.Emri,
            row.Porosi.DataPorosise,
            row.Porosi.DataPritshme,
            row.Porosi.ShumaTotale,
            row.Porosi.Statusi,
            detajet);
    }

    private static (List<DetajPorosieFurnitori> Detajet, decimal ShumaTotale) BuildDetajEntities(
        Guid porosiId,
        Dictionary<Guid, Produkt> produktet,
        IReadOnlyList<PorosiFurnitorDetajLineRequest> lines)
    {
        var grouped = lines
            .GroupBy(l => l.ProduktId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var detajet = new List<DetajPorosieFurnitori>();
        decimal shumaTotale = 0;

        foreach (var (produktId, groupLines) in grouped)
        {
            var produkt = produktet[produktId];
            var sasia = groupLines.Sum(l => l.Sasia);
            var cmimiNjesi = groupLines.FirstOrDefault(l => l.CmimiNjesi.HasValue)?.CmimiNjesi ?? produkt.CmimiBlerjes;
            if (cmimiNjesi < 0)
                throw new InvalidOperationException("Çmimi për njësi nuk mund të jetë negativ.");

            var cmimiTotal = cmimiNjesi * sasia;
            shumaTotale += cmimiTotal;

            detajet.Add(new DetajPorosieFurnitori
            {
                DetajPorosiId = Guid.NewGuid(),
                PorosiId = porosiId,
                ProduktId = produktId,
                Sasia = sasia,
                CmimiNjesi = cmimiNjesi,
                CmimiTotal = cmimiTotal
            });
        }

        return (detajet, shumaTotale);
    }

    private async Task<(string? Error, int StatusCode, Dictionary<Guid, Produkt>? Produktet)> ValidateLinesAndFurnitorAsync(
        Guid furnitorId,
        IReadOnlyList<PorosiFurnitorDetajLineRequest> lines,
        CancellationToken cancellationToken)
    {
        var furnitorEkziston = await db.Furnitoret.AnyAsync(f => f.FurnitorId == furnitorId, cancellationToken);
        if (!furnitorEkziston)
            return ("Furnitori nuk u gjet.", StatusCodes.Status404NotFound, null);

        var grouped = lines.GroupBy(l => l.ProduktId).ToDictionary(g => g.Key, g => g.Sum(x => x.Sasia));
        foreach (var kv in grouped)
        {
            if (kv.Value <= 0)
                return ($"Sasia duhet të jetë > 0 për produktin {kv.Key}.", StatusCodes.Status400BadRequest, null);
        }

        var produktIds = grouped.Keys.ToList();
        var produktet = await db.Produktet
            .Where(p => produktIds.Contains(p.ProduktId))
            .ToDictionaryAsync(p => p.ProduktId, cancellationToken);

        if (produktet.Count != produktIds.Count)
            return ("Një ose më shumë produkte nuk u gjetën.", StatusCodes.Status404NotFound, null);

        foreach (var line in lines)
        {
            if (line.CmimiNjesi is < 0)
                return ("Çmimi për njësi nuk mund të jetë negativ.", StatusCodes.Status400BadRequest, null);
        }

        return (null, StatusCodes.Status200OK, produktet);
    }
}
