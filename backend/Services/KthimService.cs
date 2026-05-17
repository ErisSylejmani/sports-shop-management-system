using backend.Contracts.Kthim;
using backend.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public sealed class KthimService(AppDbContext db)
{
    public async Task<KthimResponse?> GetDetailAsync(
        Guid kthimId,
        CancellationToken cancellationToken = default)
    {
        var row = await (
            from k in db.Kthimet.AsNoTracking()
            join pr in db.Produktet.AsNoTracking() on k.ProduktId equals pr.ProduktId
            join s in db.Shitjet.AsNoTracking() on k.ShitjeId equals s.ShitjeId
            where k.KthimId == kthimId
            select new KthimResponse(
                k.KthimId,
                k.ShitjeId,
                k.ProduktId,
                pr.Emri,
                s.DataShitjes,
                k.Sasia,
                k.Arsyeja,
                k.DataKthimit,
                k.Statusi))
            .FirstOrDefaultAsync(cancellationToken);

        return row;
    }

    public async Task<(KthimResponse? Response, string? Error, int StatusCode)> CreateAsync(
        CreateKthimRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Sasia <= 0)
            return (null, "Sasia duhet të jetë më e madhe se 0.", StatusCodes.Status400BadRequest);

        var arsyeja = request.Arsyeja.Trim();
        if (arsyeja.Length == 0)
            return (null, "Arsyeja është e detyrueshme.", StatusCodes.Status400BadRequest);

        var statusi = request.Statusi.Trim();
        if (statusi.Length == 0)
            return (null, "Statusi është i detyrueshëm.", StatusCodes.Status400BadRequest);

        var limits = await ValidateReturnQuantityAsync(
            request.ShitjeId,
            request.ProduktId,
            request.Sasia,
            excludeKthimId: null,
            cancellationToken);

        if (limits.Error is not null)
            return (null, limits.Error, limits.StatusCode);

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var produkt = await db.Produktet
                    .FirstAsync(p => p.ProduktId == request.ProduktId, cancellationToken);

                produkt.SasiaStok += request.Sasia;

                var kthimId = Guid.NewGuid();
                var kthim = new Kthim
                {
                    KthimId = kthimId,
                    ShitjeId = request.ShitjeId,
                    ProduktId = request.ProduktId,
                    Sasia = request.Sasia,
                    Arsyeja = arsyeja,
                    DataKthimit = request.DataKthimit ?? DateTime.UtcNow,
                    Statusi = statusi
                };

                db.Kthimet.Add(kthim);
                await db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);

                var detail = await GetDetailAsync(kthimId, cancellationToken);
                return (detail, (string?)null, StatusCodes.Status201Created);
            }
            catch
            {
                await tx.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    public async Task<(KthimResponse? Response, string? Error, int StatusCode)> UpdateAsync(
        Guid kthimId,
        UpdateKthimRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Sasia <= 0)
            return (null, "Sasia duhet të jetë më e madhe se 0.", StatusCodes.Status400BadRequest);

        var arsyeja = request.Arsyeja.Trim();
        if (arsyeja.Length == 0)
            return (null, "Arsyeja është e detyrueshme.", StatusCodes.Status400BadRequest);

        var statusi = request.Statusi.Trim();
        if (statusi.Length == 0)
            return (null, "Statusi është i detyrueshëm.", StatusCodes.Status400BadRequest);

        var kthim = await db.Kthimet.FirstOrDefaultAsync(k => k.KthimId == kthimId, cancellationToken);
        if (kthim is null)
            return (null, "Kthimi nuk u gjet.", StatusCodes.Status404NotFound);

        var limits = await ValidateReturnQuantityAsync(
            kthim.ShitjeId,
            kthim.ProduktId,
            request.Sasia,
            excludeKthimId: kthimId,
            cancellationToken);

        if (limits.Error is not null)
            return (null, limits.Error, limits.StatusCode);

        var delta = request.Sasia - kthim.Sasia;
        if (delta == 0 && kthim.Arsyeja == arsyeja && kthim.DataKthimit == request.DataKthimit && kthim.Statusi == statusi)
        {
            var unchanged = await GetDetailAsync(kthimId, cancellationToken);
            return (unchanged, null, StatusCodes.Status200OK);
        }

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                if (delta != 0)
                {
                    var produkt = await db.Produktet
                        .FirstAsync(p => p.ProduktId == kthim.ProduktId, cancellationToken);
                    produkt.SasiaStok += delta;
                }

                kthim.Sasia = request.Sasia;
                kthim.Arsyeja = arsyeja;
                kthim.DataKthimit = request.DataKthimit;
                kthim.Statusi = statusi;

                await db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);

                var detail = await GetDetailAsync(kthimId, cancellationToken);
                return (detail, (string?)null, StatusCodes.Status200OK);
            }
            catch
            {
                await tx.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    public async Task<(bool Success, string? Error, int StatusCode)> DeleteAsync(
        Guid kthimId,
        CancellationToken cancellationToken = default)
    {
        var kthim = await db.Kthimet.FirstOrDefaultAsync(k => k.KthimId == kthimId, cancellationToken);
        if (kthim is null)
            return (false, "Kthimi nuk u gjet.", StatusCodes.Status404NotFound);

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var produkt = await db.Produktet
                    .FirstAsync(p => p.ProduktId == kthim.ProduktId, cancellationToken);

                if (produkt.SasiaStok < kthim.Sasia)
                {
                    await tx.RollbackAsync(cancellationToken);
                    return (
                        false,
                        $"Stoku aktual ({produkt.SasiaStok}) është më i vogël se sasia e kthimit ({kthim.Sasia}).",
                        StatusCodes.Status409Conflict);
                }

                produkt.SasiaStok -= kthim.Sasia;
                db.Kthimet.Remove(kthim);

                await db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);

                return (true, (string?)null, StatusCodes.Status204NoContent);
            }
            catch
            {
                await tx.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    private async Task<(string? Error, int StatusCode)> ValidateReturnQuantityAsync(
        Guid shitjeId,
        Guid produktId,
        int requestedSasia,
        Guid? excludeKthimId,
        CancellationToken cancellationToken)
    {
        var shitjeExists = await db.Shitjet.AnyAsync(s => s.ShitjeId == shitjeId, cancellationToken);
        if (!shitjeExists)
            return ("Shitja nuk u gjet.", StatusCodes.Status404NotFound);

        var detaj = await db.DetajetShitje
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.ShitjeId == shitjeId && d.ProduktId == produktId, cancellationToken);

        if (detaj is null)
            return ("Produkti nuk është pjesë e kësaj shitjeje.", StatusCodes.Status400BadRequest);

        var returnedQuery = db.Kthimet
            .Where(k => k.ShitjeId == shitjeId && k.ProduktId == produktId);

        if (excludeKthimId is not null)
            returnedQuery = returnedQuery.Where(k => k.KthimId != excludeKthimId.Value);

        var alreadyReturned = await returnedQuery.SumAsync(k => k.Sasia, cancellationToken);
        var maxAllowed = detaj.Sasia - alreadyReturned;

        if (requestedSasia > maxAllowed)
        {
            return (
                $"Sasia e kthimit ({requestedSasia}) tejkalon sasinë e mbetur të kthyer ({maxAllowed}); " +
                $"shitur: {detaj.Sasia}, tashmë të kthyer: {alreadyReturned}.",
                StatusCodes.Status400BadRequest);
        }

        return (null, StatusCodes.Status200OK);
    }
}
