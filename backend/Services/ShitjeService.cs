using backend.Contracts.Shitje;
using backend.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public sealed class ShitjeService(AppDbContext db)
{
    public async Task<ShitjeDetailResponse?> GetDetailAsync(
        Guid shitjeId,
        CancellationToken cancellationToken = default)
    {
        var row = await (
            from shitje in db.Shitjet.AsNoTracking()
            join k in db.Klientet.AsNoTracking() on shitje.KlientId equals k.KlientId
            join p in db.Punetoret.AsNoTracking() on shitje.PunetorId equals p.PunetorId
            where shitje.ShitjeId == shitjeId
            select new { Shitje = shitje, KlientEmri = k.Emri + " " + k.Mbiemri, PunetorEmri = p.Emri + " " + p.Mbiemri })
            .FirstOrDefaultAsync(cancellationToken);

        if (row is null)
            return null;

        var detajet = await (
            from d in db.DetajetShitje.AsNoTracking()
            join pr in db.Produktet.AsNoTracking() on d.ProduktId equals pr.ProduktId
            where d.ShitjeId == shitjeId
            orderby pr.Emri
            select new KonfirmoShitjeDetajResponse(
                d.DetajShitjeId,
                d.ProduktId,
                pr.Emri,
                d.Sasia,
                d.CmimiNjesi,
                d.CmimiTotal))
            .ToListAsync(cancellationToken);

        var sh = row.Shitje;
        return new ShitjeDetailResponse(
            sh.ShitjeId,
            sh.KlientId,
            row.KlientEmri.Trim(),
            sh.PunetorId,
            row.PunetorEmri.Trim(),
            sh.DataShitjes,
            sh.ShumaTotale + sh.Zbritja,
            sh.Zbritja,
            sh.ShumaTotale,
            sh.MetodaPageses,
            detajet);
    }

    /// <summary>Transaksion: krijon shitjen + detajet dhe zbrit stokun.</summary>
    public Task<(KonfirmoShitjeResponse? Response, string? Error, int StatusCode)> KonfirmoShitjeAsync(
        KonfirmoShitjeRequest request,
        CancellationToken cancellationToken = default) =>
        CreateInternalAsync(
            request.KlientId,
            request.PunetorId,
            request.DataShitjes,
            request.Zbritja,
            request.MetodaPageses,
            request.Detajet,
            cancellationToken);

    public Task<(KonfirmoShitjeResponse? Response, string? Error, int StatusCode)> CreateAsync(
        CreateShitjeRequest request,
        CancellationToken cancellationToken = default) =>
        CreateInternalAsync(
            request.KlientId,
            request.PunetorId,
            request.DataShitjes,
            request.Zbritja,
            request.MetodaPageses,
            request.Detajet,
            cancellationToken);

    public async Task<(ShitjeDetailResponse? Response, string? Error, int StatusCode)> UpdateAsync(
        Guid shitjeId,
        UpdateShitjeRequest request,
        CancellationToken cancellationToken = default)
    {
        var shitje = await db.Shitjet
            .Include(s => s.Detajet)
            .FirstOrDefaultAsync(s => s.ShitjeId == shitjeId, cancellationToken);

        if (shitje is null)
            return (null, "Shitja nuk u gjet.", StatusCodes.Status404NotFound);

        if (await db.Kthimet.AnyAsync(k => k.ShitjeId == shitjeId, cancellationToken))
            return (null, "Nuk mund të përditësohet: ka kthime të lidhura.", StatusCodes.Status409Conflict);

        var validation = await ValidateForWriteAsync(
            request.KlientId,
            request.PunetorId,
            request.Zbritja,
            request.MetodaPageses,
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
                var produktIds = shitje.Detajet.Select(d => d.ProduktId).Distinct().ToList();
                var produktet = await db.Produktet
                    .Where(p => produktIds.Contains(p.ProduktId))
                    .ToDictionaryAsync(p => p.ProduktId, cancellationToken);

                foreach (var detaj in shitje.Detajet)
                {
                    if (produktet.TryGetValue(detaj.ProduktId, out var produkt))
                        produkt.SasiaStok += detaj.Sasia;
                }

                db.DetajetShitje.RemoveRange(shitje.Detajet);
                shitje.Detajet.Clear();

                var (_, shumaParaZbritjes) = await ApplyDetajetAndStockAsync(
                    shitjeId,
                    validation.Grouped!,
                    validation.Produktet!,
                    cancellationToken);

                if (request.Zbritja > shumaParaZbritjes)
                {
                    await tx.RollbackAsync(cancellationToken);
                    return (null, "Zbritja është më e madhe se shuma e artikujve.", StatusCodes.Status400BadRequest);
                }

                shitje.KlientId = request.KlientId;
                shitje.PunetorId = request.PunetorId;
                shitje.DataShitjes = request.DataShitjes ?? shitje.DataShitjes;
                shitje.Zbritja = request.Zbritja;
                shitje.ShumaTotale = shumaParaZbritjes - request.Zbritja;
                shitje.MetodaPageses = validation.Metoda!;

                await db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);

                var detail = await GetDetailAsync(shitjeId, cancellationToken);
                return (detail, (string?)null, StatusCodes.Status200OK);
            }
            catch
            {
                await tx.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    public async Task<IReadOnlyList<KonfirmoShitjeDetajResponse>?> ListDetajetAsync(
        Guid shitjeId,
        CancellationToken cancellationToken = default)
    {
        if (!await db.Shitjet.AnyAsync(s => s.ShitjeId == shitjeId, cancellationToken))
            return null;

        return await (
            from d in db.DetajetShitje.AsNoTracking()
            join pr in db.Produktet.AsNoTracking() on d.ProduktId equals pr.ProduktId
            where d.ShitjeId == shitjeId
            orderby pr.Emri
            select new KonfirmoShitjeDetajResponse(
                d.DetajShitjeId,
                d.ProduktId,
                pr.Emri,
                d.Sasia,
                d.CmimiNjesi,
                d.CmimiTotal))
            .ToListAsync(cancellationToken);
    }

    public async Task<KonfirmoShitjeDetajResponse?> GetDetajAsync(
        Guid shitjeId,
        Guid detajId,
        CancellationToken cancellationToken = default)
    {
        return await (
            from d in db.DetajetShitje.AsNoTracking()
            join pr in db.Produktet.AsNoTracking() on d.ProduktId equals pr.ProduktId
            where d.ShitjeId == shitjeId && d.DetajShitjeId == detajId
            select new KonfirmoShitjeDetajResponse(
                d.DetajShitjeId,
                d.ProduktId,
                pr.Emri,
                d.Sasia,
                d.CmimiNjesi,
                d.CmimiTotal))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<(KonfirmoShitjeDetajResponse? Response, string? Error, int StatusCode)> AddDetajAsync(
        Guid shitjeId,
        AddDetajShitjeRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Sasia <= 0)
            return (null, "Sasia duhet të jetë > 0.", StatusCodes.Status400BadRequest);

        var editable = await LoadEditableShitjeAsync(shitjeId, cancellationToken);
        if (editable.Error is not null)
            return (null, editable.Error, editable.StatusCode);

        var produkt = await db.Produktet.FirstOrDefaultAsync(p => p.ProduktId == request.ProduktId, cancellationToken);
        if (produkt is null)
            return (null, "Produkti nuk u gjet.", StatusCodes.Status404NotFound);

        if (produkt.SasiaStok < request.Sasia)
            return (null, $"Stoku nuk mjafton për '{produkt.Emri}'.", StatusCodes.Status409Conflict);

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var shitje = editable.Shitje!;
                var cmimiNjesi = produkt.CmimiShitjes;
                var cmimiTotal = cmimiNjesi * request.Sasia;
                produkt.SasiaStok -= request.Sasia;

                var detajId = Guid.NewGuid();
                var detaj = new DetajShitje
                {
                    DetajShitjeId = detajId,
                    ShitjeId = shitjeId,
                    ProduktId = request.ProduktId,
                    Sasia = request.Sasia,
                    CmimiNjesi = cmimiNjesi,
                    CmimiTotal = cmimiTotal
                };
                db.DetajetShitje.Add(detaj);
                shitje.Detajet.Add(detaj);

                if (!TryRecalculateTotals(shitje, out var totalsError))
                {
                    await tx.RollbackAsync(cancellationToken);
                    return (null, totalsError, StatusCodes.Status400BadRequest);
                }

                await db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);

                return (new KonfirmoShitjeDetajResponse(
                    detajId, request.ProduktId, produkt.Emri, request.Sasia, cmimiNjesi, cmimiTotal),
                    (string?)null,
                    StatusCodes.Status201Created);
            }
            catch
            {
                await tx.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    public async Task<(KonfirmoShitjeDetajResponse? Response, string? Error, int StatusCode)> UpdateDetajAsync(
        Guid shitjeId,
        Guid detajId,
        UpdateDetajShitjeRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Sasia <= 0)
            return (null, "Sasia duhet të jetë > 0.", StatusCodes.Status400BadRequest);

        var editable = await LoadEditableShitjeAsync(shitjeId, cancellationToken);
        if (editable.Error is not null)
            return (null, editable.Error, editable.StatusCode);

        var detaj = editable.Shitje!.Detajet.FirstOrDefault(d => d.DetajShitjeId == detajId);
        if (detaj is null)
            return (null, "Rreshti i shitjes nuk u gjet.", StatusCodes.Status404NotFound);

        var produkt = await db.Produktet.FirstOrDefaultAsync(p => p.ProduktId == detaj.ProduktId, cancellationToken);
        if (produkt is null)
            return (null, "Produkti nuk u gjet.", StatusCodes.Status404NotFound);

        var delta = request.Sasia - detaj.Sasia;
        if (delta > 0 && produkt.SasiaStok < delta)
            return (null, $"Stoku nuk mjafton për '{produkt.Emri}'.", StatusCodes.Status409Conflict);

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                produkt.SasiaStok -= delta;
                detaj.Sasia = request.Sasia;
                detaj.CmimiTotal = detaj.CmimiNjesi * request.Sasia;

                if (!TryRecalculateTotals(editable.Shitje!, out var totalsError))
                {
                    await tx.RollbackAsync(cancellationToken);
                    return (null, totalsError, StatusCodes.Status400BadRequest);
                }

                await db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);

                return (new KonfirmoShitjeDetajResponse(
                    detaj.DetajShitjeId,
                    detaj.ProduktId,
                    produkt.Emri,
                    detaj.Sasia,
                    detaj.CmimiNjesi,
                    detaj.CmimiTotal),
                    (string?)null,
                    StatusCodes.Status200OK);
            }
            catch
            {
                await tx.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    public async Task<(bool Success, string? Error, int StatusCode)> DeleteDetajAsync(
        Guid shitjeId,
        Guid detajId,
        CancellationToken cancellationToken = default)
    {
        var editable = await LoadEditableShitjeAsync(shitjeId, cancellationToken);
        if (editable.Error is not null)
            return (false, editable.Error, editable.StatusCode);

        var detaj = editable.Shitje!.Detajet.FirstOrDefault(d => d.DetajShitjeId == detajId);
        if (detaj is null)
            return (false, "Rreshti i shitjes nuk u gjet.", StatusCodes.Status404NotFound);

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var produkt = await db.Produktet.FirstOrDefaultAsync(p => p.ProduktId == detaj.ProduktId, cancellationToken);
                if (produkt is not null)
                    produkt.SasiaStok += detaj.Sasia;

                db.DetajetShitje.Remove(detaj);
                editable.Shitje!.Detajet.Remove(detaj);

                if (!TryRecalculateTotals(editable.Shitje, out var totalsError))
                {
                    await tx.RollbackAsync(cancellationToken);
                    return (false, totalsError, StatusCodes.Status400BadRequest);
                }

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

    /// <summary>Zëvendëson të gjithë rreshtat; rikthen/zbrit stokun si në përditësimin e plotë të shitjes.</summary>
    public async Task<(ShitjeDetailResponse? Response, string? Error, int StatusCode)> ReplaceDetajetAsync(
        Guid shitjeId,
        ReplaceShitjeDetajetRequest request,
        CancellationToken cancellationToken = default)
    {
        var linesValidation = await ValidateDetajetLinesAsync(request.Detajet, cancellationToken);
        if (linesValidation.Error is not null)
            return (null, linesValidation.Error, linesValidation.StatusCode);

        var editable = await LoadEditableShitjeAsync(shitjeId, cancellationToken);
        if (editable.Error is not null)
            return (null, editable.Error, editable.StatusCode);

        var shitje = editable.Shitje!;

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var oldProduktIds = shitje.Detajet.Select(d => d.ProduktId).Distinct().ToList();
                var oldProduktet = await db.Produktet
                    .Where(p => oldProduktIds.Contains(p.ProduktId))
                    .ToDictionaryAsync(p => p.ProduktId, cancellationToken);

                foreach (var detaj in shitje.Detajet)
                {
                    if (oldProduktet.TryGetValue(detaj.ProduktId, out var produkt))
                        produkt.SasiaStok += detaj.Sasia;
                }

                db.DetajetShitje.RemoveRange(shitje.Detajet);
                shitje.Detajet.Clear();

                var (_, shumaParaZbritjes) = await ApplyDetajetAndStockAsync(
                    shitjeId,
                    linesValidation.Grouped!,
                    linesValidation.Produktet!,
                    cancellationToken);

                if (shitje.Zbritja > shumaParaZbritjes)
                {
                    await tx.RollbackAsync(cancellationToken);
                    return (null, "Zbritja është më e madhe se shuma e artikujve.", StatusCodes.Status400BadRequest);
                }

                shitje.ShumaTotale = shumaParaZbritjes - shitje.Zbritja;

                await db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);

                var detail = await GetDetailAsync(shitjeId, cancellationToken);
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
        Guid shitjeId,
        CancellationToken cancellationToken = default)
    {
        var shitje = await db.Shitjet
            .Include(s => s.Detajet)
            .FirstOrDefaultAsync(s => s.ShitjeId == shitjeId, cancellationToken);

        if (shitje is null)
            return (false, "Shitja nuk u gjet.", StatusCodes.Status404NotFound);

        if (await db.Kthimet.AnyAsync(k => k.ShitjeId == shitjeId, cancellationToken))
            return (false, "Nuk mund të fshihet: ka kthime të lidhura.", StatusCodes.Status409Conflict);

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var produktIds = shitje.Detajet.Select(d => d.ProduktId).Distinct().ToList();
                var produktet = await db.Produktet
                    .Where(p => produktIds.Contains(p.ProduktId))
                    .ToDictionaryAsync(p => p.ProduktId, cancellationToken);

                foreach (var detaj in shitje.Detajet)
                {
                    if (produktet.TryGetValue(detaj.ProduktId, out var produkt))
                        produkt.SasiaStok += detaj.Sasia;
                }

                db.Shitjet.Remove(shitje);
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

    private async Task<(KonfirmoShitjeResponse? Response, string? Error, int StatusCode)> CreateInternalAsync(
        Guid klientId,
        Guid punetorId,
        DateTime? dataShitjes,
        decimal zbritja,
        string metodaPageses,
        IReadOnlyList<KonfirmoShitjeLineRequest> detajet,
        CancellationToken cancellationToken)
    {
        var validation = await ValidateForWriteAsync(
            klientId,
            punetorId,
            zbritja,
            metodaPageses,
            detajet,
            cancellationToken);

        if (validation.Error is not null)
            return (null, validation.Error, validation.StatusCode);

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var shitjeId = Guid.NewGuid();
                var (detajResponses, shumaParaZbritjes) = await ApplyDetajetAndStockAsync(
                    shitjeId,
                    validation.Grouped!,
                    validation.Produktet!,
                    cancellationToken);

                if (zbritja > shumaParaZbritjes)
                {
                    await tx.RollbackAsync(cancellationToken);
                    return (null, "Zbritja është më e madhe se shuma e artikujve.", StatusCodes.Status400BadRequest);
                }

                var shitje = new Shitje
                {
                    ShitjeId = shitjeId,
                    KlientId = klientId,
                    PunetorId = punetorId,
                    DataShitjes = dataShitjes ?? DateTime.UtcNow,
                    ShumaTotale = shumaParaZbritjes - zbritja,
                    Zbritja = zbritja,
                    MetodaPageses = validation.Metoda!
                };

                db.Shitjet.Add(shitje);

                await db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);

                var response = new KonfirmoShitjeResponse(
                    shitjeId,
                    shumaParaZbritjes,
                    zbritja,
                    shumaParaZbritjes - zbritja,
                    detajResponses);

                return (response, (string?)null, StatusCodes.Status201Created);
            }
            catch
            {
                await tx.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    private async Task<(List<KonfirmoShitjeDetajResponse> Detajet, decimal ShumaParaZbritjes)> ApplyDetajetAndStockAsync(
        Guid shitjeId,
        Dictionary<Guid, int> grouped,
        Dictionary<Guid, Produkt> produktet,
        CancellationToken cancellationToken)
    {
        var detajResponses = new List<KonfirmoShitjeDetajResponse>();
        decimal shumaParaZbritjes = 0;

        foreach (var (produktId, kerkuar) in grouped)
        {
            var p = produktet[produktId];
            var cmimiNjesi = p.CmimiShitjes;
            var cmimiTotal = cmimiNjesi * kerkuar;
            shumaParaZbritjes += cmimiTotal;

            p.SasiaStok -= kerkuar;

            var detajId = Guid.NewGuid();
            db.DetajetShitje.Add(new DetajShitje
            {
                DetajShitjeId = detajId,
                ShitjeId = shitjeId,
                ProduktId = produktId,
                Sasia = kerkuar,
                CmimiNjesi = cmimiNjesi,
                CmimiTotal = cmimiTotal
            });

            detajResponses.Add(new KonfirmoShitjeDetajResponse(
                detajId,
                produktId,
                p.Emri,
                kerkuar,
                cmimiNjesi,
                cmimiTotal));
        }

        return (detajResponses, shumaParaZbritjes);
    }

    private async Task<(Shitje? Shitje, string? Error, int StatusCode)> LoadEditableShitjeAsync(
        Guid shitjeId,
        CancellationToken cancellationToken)
    {
        var shitje = await db.Shitjet
            .Include(s => s.Detajet)
            .FirstOrDefaultAsync(s => s.ShitjeId == shitjeId, cancellationToken);

        if (shitje is null)
            return (null, "Shitja nuk u gjet.", StatusCodes.Status404NotFound);

        if (await db.Kthimet.AnyAsync(k => k.ShitjeId == shitjeId, cancellationToken))
            return (null, "Nuk mund të ndryshohet: ka kthime të lidhura.", StatusCodes.Status409Conflict);

        return (shitje, null, StatusCodes.Status200OK);
    }

    private static bool TryRecalculateTotals(Shitje shitje, out string? error)
    {
        var shumaParaZbritjes = shitje.Detajet.Sum(d => d.CmimiTotal);
        if (shitje.Zbritja > shumaParaZbritjes)
        {
            error = "Zbritja është më e madhe se shuma e artikujve.";
            return false;
        }

        shitje.ShumaTotale = shumaParaZbritjes - shitje.Zbritja;
        error = null;
        return true;
    }

    private async Task<DetajLinesValidationResult> ValidateDetajetLinesAsync(
        IReadOnlyList<KonfirmoShitjeLineRequest> detajet,
        CancellationToken cancellationToken)
    {
        if (detajet.Count == 0)
            return DetajLinesValidationResult.Fail("Lista e produkteve është bosh.", StatusCodes.Status400BadRequest);

        var grouped = detajet
            .GroupBy(d => d.ProduktId)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Sasia));

        foreach (var kv in grouped)
        {
            if (kv.Value <= 0)
                return DetajLinesValidationResult.Fail($"Sasia duhet të jetë > 0 për produktin {kv.Key}.", StatusCodes.Status400BadRequest);
        }

        var produktIds = grouped.Keys.ToList();
        var produktet = await db.Produktet
            .Where(p => produktIds.Contains(p.ProduktId))
            .ToDictionaryAsync(p => p.ProduktId, cancellationToken);

        if (produktet.Count != produktIds.Count)
            return DetajLinesValidationResult.Fail("Një ose më shumë produkte nuk u gjetën.", StatusCodes.Status404NotFound);

        var gabimeStoku = new List<string>();
        foreach (var (produktId, kerkuar) in grouped)
        {
            var p = produktet[produktId];
            if (p.SasiaStok < kerkuar)
                gabimeStoku.Add($"{p.Emri}: nevojitet {kerkuar}, në stok {p.SasiaStok}");
        }

        if (gabimeStoku.Count > 0)
            return DetajLinesValidationResult.Fail("Stoku nuk mjafton: " + string.Join("; ", gabimeStoku), StatusCodes.Status409Conflict);

        return DetajLinesValidationResult.Ok(grouped, produktet);
    }

    private async Task<WriteValidationResult> ValidateForWriteAsync(
        Guid klientId,
        Guid punetorId,
        decimal zbritja,
        string metodaPageses,
        IReadOnlyList<KonfirmoShitjeLineRequest> detajet,
        CancellationToken cancellationToken)
    {
        if (detajet.Count == 0)
            return WriteValidationResult.Fail("Lista e produkteve është bosh.", StatusCodes.Status400BadRequest);

        var metoda = metodaPageses.Trim();
        if (metoda.Length == 0)
            return WriteValidationResult.Fail("Metoda e pagesës është e detyrueshme.", StatusCodes.Status400BadRequest);

        if (zbritja < 0)
            return WriteValidationResult.Fail("Zbritja nuk mund të jetë negative.", StatusCodes.Status400BadRequest);

        var grouped = detajet
            .GroupBy(d => d.ProduktId)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Sasia));

        foreach (var kv in grouped)
        {
            if (kv.Value <= 0)
                return WriteValidationResult.Fail($"Sasia duhet të jetë > 0 për produktin {kv.Key}.", StatusCodes.Status400BadRequest);
        }

        if (!await db.Klientet.AnyAsync(k => k.KlientId == klientId, cancellationToken))
            return WriteValidationResult.Fail("Klienti nuk u gjet.", StatusCodes.Status404NotFound);

        if (!await db.Punetoret.AnyAsync(p => p.PunetorId == punetorId, cancellationToken))
            return WriteValidationResult.Fail("Punëtori nuk u gjet.", StatusCodes.Status404NotFound);

        var produktIds = grouped.Keys.ToList();
        var produktet = await db.Produktet
            .Where(p => produktIds.Contains(p.ProduktId))
            .ToDictionaryAsync(p => p.ProduktId, cancellationToken);

        if (produktet.Count != produktIds.Count)
            return WriteValidationResult.Fail("Një ose më shumë produkte nuk u gjetën.", StatusCodes.Status404NotFound);

        var gabimeStoku = new List<string>();
        foreach (var (produktId, kerkuar) in grouped)
        {
            var p = produktet[produktId];
            if (p.SasiaStok < kerkuar)
                gabimeStoku.Add($"{p.Emri}: nevojitet {kerkuar}, në stok {p.SasiaStok}");
        }

        if (gabimeStoku.Count > 0)
            return WriteValidationResult.Fail("Stoku nuk mjafton: " + string.Join("; ", gabimeStoku), StatusCodes.Status409Conflict);

        return WriteValidationResult.Ok(grouped, produktet, metoda);
    }

    private sealed record WriteValidationResult(
        string? Error,
        int StatusCode,
        Dictionary<Guid, int>? Grouped,
        Dictionary<Guid, Produkt>? Produktet,
        string? Metoda)
    {
        public static WriteValidationResult Fail(string error, int statusCode) =>
            new(error, statusCode, null, null, null);

        public static WriteValidationResult Ok(
            Dictionary<Guid, int> grouped,
            Dictionary<Guid, Produkt> produktet,
            string metoda) =>
            new(null, StatusCodes.Status200OK, grouped, produktet, metoda);
    }

    private sealed record DetajLinesValidationResult(
        string? Error,
        int StatusCode,
        Dictionary<Guid, int>? Grouped,
        Dictionary<Guid, Produkt>? Produktet)
    {
        public static DetajLinesValidationResult Fail(string error, int statusCode) =>
            new(error, statusCode, null, null);

        public static DetajLinesValidationResult Ok(
            Dictionary<Guid, int> grouped,
            Dictionary<Guid, Produkt> produktet) =>
            new(null, StatusCodes.Status200OK, grouped, produktet);
    }
}
