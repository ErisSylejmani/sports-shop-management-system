using backend.Contracts.Oferta;
using backend.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public sealed class OfertaService(AppDbContext db)
{
    public async Task<OfertaDetailResponse?> GetDetailAsync(
        Guid ofertaId,
        CancellationToken cancellationToken = default) =>
        await BuildDetailResponseAsync(ofertaId, cancellationToken);

    public async Task<(OfertaDetailResponse? Response, string? Error, int StatusCode)> CreateAsync(
        CreateOfertaRequest request,
        CancellationToken cancellationToken = default)
    {
        var headerValidation = ValidateHeader(
            request.Emri,
            request.Pershkrimi,
            request.PerqindjaZbritjes,
            request.DataFillimit,
            request.DataPerfundimit,
            request.Statusi);
        if (headerValidation is not null)
            return (null, headerValidation, StatusCodes.Status400BadRequest);

        var produktValidation = await ValidateProduktIdsAsync(request.ProduktIds, cancellationToken);
        if (produktValidation.Error is not null)
            return (null, produktValidation.Error, produktValidation.StatusCode);

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var ofertaId = Guid.NewGuid();
                var oferta = BuildOfertaEntity(
                    ofertaId,
                    request.Emri,
                    request.Pershkrimi,
                    request.PerqindjaZbritjes,
                    request.DataFillimit,
                    request.DataPerfundimit,
                    request.Statusi);

                db.Ofertat.Add(oferta);
                db.OferteProdukte.AddRange(BuildLinkEntities(ofertaId, produktValidation.DistinctIds!));

                await db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);

                var response = await BuildDetailResponseAsync(ofertaId, cancellationToken);
                return (response, (string?)null, StatusCodes.Status201Created);
            }
            catch
            {
                await tx.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    public async Task<(OfertaDetailResponse? Response, string? Error, int StatusCode)> UpdateAsync(
        Guid ofertaId,
        UpdateOfertaRequest request,
        CancellationToken cancellationToken = default)
    {
        var headerValidation = ValidateHeader(
            request.Emri,
            request.Pershkrimi,
            request.PerqindjaZbritjes,
            request.DataFillimit,
            request.DataPerfundimit,
            request.Statusi);
        if (headerValidation is not null)
            return (null, headerValidation, StatusCodes.Status400BadRequest);

        var produktValidation = await ValidateProduktIdsAsync(request.ProduktIds, cancellationToken);
        if (produktValidation.Error is not null)
            return (null, produktValidation.Error, produktValidation.StatusCode);

        var oferta = await db.Ofertat
            .Include(o => o.OferteProdukte)
            .FirstOrDefaultAsync(o => o.OfertaId == ofertaId, cancellationToken);

        if (oferta is null)
            return (null, "Oferta nuk u gjet.", StatusCodes.Status404NotFound);

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                ApplyHeader(oferta, request.Emri, request.Pershkrimi, request.PerqindjaZbritjes,
                    request.DataFillimit, request.DataPerfundimit, request.Statusi);

                db.OferteProdukte.RemoveRange(oferta.OferteProdukte);
                oferta.OferteProdukte.Clear();
                db.OferteProdukte.AddRange(BuildLinkEntities(ofertaId, produktValidation.DistinctIds!));

                await db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);

                var response = await BuildDetailResponseAsync(ofertaId, cancellationToken);
                return (response, (string?)null, StatusCodes.Status200OK);
            }
            catch
            {
                await tx.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    public async Task<(bool Success, string? Error, int StatusCode)> DeleteAsync(
        Guid ofertaId,
        CancellationToken cancellationToken = default)
    {
        var oferta = await db.Ofertat.FirstOrDefaultAsync(o => o.OfertaId == ofertaId, cancellationToken);
        if (oferta is null)
            return (false, "Oferta nuk u gjet.", StatusCodes.Status404NotFound);

        db.Ofertat.Remove(oferta);
        await db.SaveChangesAsync(cancellationToken);

        return (true, null, StatusCodes.Status204NoContent);
    }

    public async Task<(IReadOnlyList<OferteProduktResponse>? Items, string? Error, int StatusCode)> ListProduktetAsync(
        Guid ofertaId,
        CancellationToken cancellationToken = default)
    {
        if (!await db.Ofertat.AnyAsync(o => o.OfertaId == ofertaId, cancellationToken))
            return (null, "Oferta nuk u gjet.", StatusCodes.Status404NotFound);

        var items = await QueryProduktetAsync(ofertaId, cancellationToken);
        return (items, null, StatusCodes.Status200OK);
    }

    public async Task<(OferteProduktResponse? Response, string? Error, int StatusCode)> AddProduktAsync(
        Guid ofertaId,
        Guid produktId,
        CancellationToken cancellationToken = default)
    {
        var ofertaExists = await db.Ofertat.AnyAsync(o => o.OfertaId == ofertaId, cancellationToken);
        if (!ofertaExists)
            return (null, "Oferta nuk u gjet.", StatusCodes.Status404NotFound);

        var produktExists = await db.Produktet.AnyAsync(p => p.ProduktId == produktId, cancellationToken);
        if (!produktExists)
            return (null, "Produkti nuk u gjet.", StatusCodes.Status404NotFound);

        if (await db.OferteProdukte.AnyAsync(
                o => o.OfertaId == ofertaId && o.ProduktId == produktId,
                cancellationToken))
            return (null, "Produkti është tashmë në këtë ofertë.", StatusCodes.Status409Conflict);

        var link = new OferteProdukt
        {
            OferteProduktId = Guid.NewGuid(),
            OfertaId = ofertaId,
            ProduktId = produktId
        };

        db.OferteProdukte.Add(link);
        await db.SaveChangesAsync(cancellationToken);

        var produktEmri = await db.Produktet
            .AsNoTracking()
            .Where(p => p.ProduktId == produktId)
            .Select(p => p.Emri)
            .FirstAsync(cancellationToken);

        return (
            new OferteProduktResponse(link.OferteProduktId, link.ProduktId, produktEmri),
            null,
            StatusCodes.Status201Created);
    }

    public async Task<(bool Success, string? Error, int StatusCode)> RemoveProduktAsync(
        Guid ofertaId,
        Guid oferteProduktId,
        CancellationToken cancellationToken = default)
    {
        var link = await db.OferteProdukte
            .FirstOrDefaultAsync(
                o => o.OferteProduktId == oferteProduktId && o.OfertaId == ofertaId,
                cancellationToken);

        if (link is null)
            return (false, "Lidhja ofertë–produkt nuk u gjet.", StatusCodes.Status404NotFound);

        db.OferteProdukte.Remove(link);
        await db.SaveChangesAsync(cancellationToken);

        return (true, null, StatusCodes.Status204NoContent);
    }

    public async Task<(OfertaDetailResponse? Response, string? Error, int StatusCode)> ReplaceProduktetAsync(
        Guid ofertaId,
        IReadOnlyList<Guid> produktIds,
        CancellationToken cancellationToken = default)
    {
        var produktValidation = await ValidateProduktIdsAsync(produktIds, cancellationToken);
        if (produktValidation.Error is not null)
            return (null, produktValidation.Error, produktValidation.StatusCode);

        var oferta = await db.Ofertat
            .Include(o => o.OferteProdukte)
            .FirstOrDefaultAsync(o => o.OfertaId == ofertaId, cancellationToken);

        if (oferta is null)
            return (null, "Oferta nuk u gjet.", StatusCodes.Status404NotFound);

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                db.OferteProdukte.RemoveRange(oferta.OferteProdukte);
                oferta.OferteProdukte.Clear();
                db.OferteProdukte.AddRange(BuildLinkEntities(ofertaId, produktValidation.DistinctIds!));

                await db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);

                var response = await BuildDetailResponseAsync(ofertaId, cancellationToken);
                return (response, (string?)null, StatusCodes.Status200OK);
            }
            catch
            {
                await tx.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    private async Task<OfertaDetailResponse?> BuildDetailResponseAsync(
        Guid ofertaId,
        CancellationToken cancellationToken)
    {
        var oferta = await db.Ofertat.AsNoTracking().FirstOrDefaultAsync(o => o.OfertaId == ofertaId, cancellationToken);
        if (oferta is null)
            return null;

        var produktet = await QueryProduktetAsync(ofertaId, cancellationToken);

        return new OfertaDetailResponse(
            oferta.OfertaId,
            oferta.Emri,
            oferta.Pershkrimi,
            oferta.PerqindjaZbritjes,
            oferta.DataFillimit,
            oferta.DataPerfundimit,
            oferta.Statusi,
            produktet);
    }

    private async Task<IReadOnlyList<OferteProduktResponse>> QueryProduktetAsync(
        Guid ofertaId,
        CancellationToken cancellationToken) =>
        await (
            from op in db.OferteProdukte.AsNoTracking()
            join p in db.Produktet.AsNoTracking() on op.ProduktId equals p.ProduktId
            where op.OfertaId == ofertaId
            orderby p.Emri
            select new OferteProduktResponse(op.OferteProduktId, op.ProduktId, p.Emri))
            .ToListAsync(cancellationToken);

    private static Oferta BuildOfertaEntity(
        Guid ofertaId,
        string emri,
        string? pershkrimi,
        decimal perqindjaZbritjes,
        DateTime dataFillimit,
        DateTime dataPerfundimit,
        string statusi)
    {
        var oferta = new Oferta { OfertaId = ofertaId };
        ApplyHeader(oferta, emri, pershkrimi, perqindjaZbritjes, dataFillimit, dataPerfundimit, statusi);
        return oferta;
    }

    private static void ApplyHeader(
        Oferta oferta,
        string emri,
        string? pershkrimi,
        decimal perqindjaZbritjes,
        DateTime dataFillimit,
        DateTime dataPerfundimit,
        string statusi)
    {
        oferta.Emri = emri.Trim();
        oferta.Pershkrimi = string.IsNullOrWhiteSpace(pershkrimi) ? null : pershkrimi.Trim();
        oferta.PerqindjaZbritjes = perqindjaZbritjes;
        oferta.DataFillimit = dataFillimit;
        oferta.DataPerfundimit = dataPerfundimit;
        oferta.Statusi = statusi.Trim();
    }

    private static List<OferteProdukt> BuildLinkEntities(Guid ofertaId, IReadOnlyList<Guid> produktIds) =>
        produktIds
            .Select(produktId => new OferteProdukt
            {
                OferteProduktId = Guid.NewGuid(),
                OfertaId = ofertaId,
                ProduktId = produktId
            })
            .ToList();

    private static string? ValidateHeader(
        string emri,
        string? pershkrimi,
        decimal perqindjaZbritjes,
        DateTime dataFillimit,
        DateTime dataPerfundimit,
        string statusi)
    {
        if (string.IsNullOrWhiteSpace(emri))
            return "Emri është i detyrueshëm.";

        if (string.IsNullOrWhiteSpace(statusi))
            return "Statusi është i detyrueshëm.";

        if (perqindjaZbritjes < 0 || perqindjaZbritjes > 100)
            return "Përqindja e zbritjes duhet të jetë midis 0 dhe 100.";

        if (dataPerfundimit < dataFillimit)
            return "Data e përfundimit nuk mund të jetë para datës së fillimit.";

        if (pershkrimi is { Length: > 4000 })
            return "Përshkrimi është shumë i gjatë.";

        return null;
    }

    private async Task<(string? Error, int StatusCode, List<Guid>? DistinctIds)> ValidateProduktIdsAsync(
        IReadOnlyList<Guid> produktIds,
        CancellationToken cancellationToken)
    {
        var distinctIds = produktIds.Distinct().ToList();
        if (distinctIds.Count == 0)
            return (null, StatusCodes.Status200OK, distinctIds);

        var found = await db.Produktet
            .Where(p => distinctIds.Contains(p.ProduktId))
            .Select(p => p.ProduktId)
            .ToListAsync(cancellationToken);

        if (found.Count != distinctIds.Count)
            return ("Një ose më shumë produkte nuk u gjetën.", StatusCodes.Status404NotFound, null);

        return (null, StatusCodes.Status200OK, distinctIds);
    }
}
