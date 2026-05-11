using backend.Contracts.Shitje;
using backend.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public sealed class ShitjeService(AppDbContext db)
{
    /// <summary>
    /// Transaksion: krijon shitjen + detajet dhe zbrit stokun për çdo produkt.
    /// </summary>
    public async Task<(KonfirmoShitjeResponse? Response, string? Error, int StatusCode)> KonfirmoShitjeAsync(
        KonfirmoShitjeRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Detajet.Count == 0)
            return (null, "Lista e produkteve është bosh.", StatusCodes.Status400BadRequest);

        var metoda = request.MetodaPageses.Trim();
        if (metoda.Length == 0)
            return (null, "Metoda e pagesës është e detyrueshme.", StatusCodes.Status400BadRequest);

        if (request.Zbritja < 0)
            return (null, "Zbritja nuk mund të jetë negative.", StatusCodes.Status400BadRequest);

        var grouped = request.Detajet
            .GroupBy(d => d.ProduktId)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Sasia));

        foreach (var kv in grouped)
        {
            if (kv.Value <= 0)
                return (null, $"Sasia duhet të jetë > 0 për produktin {kv.Key}.", StatusCodes.Status400BadRequest);
        }

        var klientExists = await db.Klientet.AnyAsync(k => k.KlientId == request.KlientId, cancellationToken);
        if (!klientExists)
            return (null, "Klienti nuk u gjet.", StatusCodes.Status404NotFound);

        var punetorExists = await db.Punetoret.AnyAsync(p => p.PunetorId == request.PunetorId, cancellationToken);
        if (!punetorExists)
            return (null, "Punëtori nuk u gjet.", StatusCodes.Status404NotFound);

        var produktIds = grouped.Keys.ToList();
        var produktet = await db.Produktet
            .Where(p => produktIds.Contains(p.ProduktId))
            .ToListAsync(cancellationToken);

        if (produktet.Count != produktIds.Count)
            return (null, "Një ose më shumë produkte nuk u gjetën.", StatusCodes.Status404NotFound);

        decimal shumaParaZbritjes = 0;
        var gabimeStoku = new List<string>();

        foreach (var p in produktet)
        {
            var kerkuar = grouped[p.ProduktId];
            var cmimiTotal = p.CmimiShitjes * kerkuar;
            shumaParaZbritjes += cmimiTotal;

            if (p.SasiaStok < kerkuar)
                gabimeStoku.Add($"{p.Emri}: nevojitet {kerkuar}, në stok {p.SasiaStok}");
        }

        if (gabimeStoku.Count > 0)
            return (null, "Stoku nuk mjafton: " + string.Join("; ", gabimeStoku), StatusCodes.Status409Conflict);

        if (request.Zbritja > shumaParaZbritjes)
            return (null, "Zbritja është më e madhe se shuma e artikujve.", StatusCodes.Status400BadRequest);

        var shumaTotale = shumaParaZbritjes - request.Zbritja;

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var shitjeId = Guid.NewGuid();
                var dataShitjes = request.DataShitjes ?? DateTime.UtcNow;

                var shitje = new Shitje
                {
                    ShitjeId = shitjeId,
                    KlientId = request.KlientId,
                    PunetorId = request.PunetorId,
                    DataShitjes = dataShitjes,
                    ShumaTotale = shumaTotale,
                    Zbritja = request.Zbritja,
                    MetodaPageses = metoda
                };

                db.Shitjet.Add(shitje);

                var detajResponses = new List<KonfirmoShitjeDetajResponse>();

                foreach (var p in produktet)
                {
                    var kerkuar = grouped[p.ProduktId];
                    var cmimiNjesi = p.CmimiShitjes;
                    var cmimiTotal = cmimiNjesi * kerkuar;

                    p.SasiaStok -= kerkuar;

                    var detajId = Guid.NewGuid();
                    db.DetajetShitje.Add(new DetajShitje
                    {
                        DetajShitjeId = detajId,
                        ShitjeId = shitjeId,
                        ProduktId = p.ProduktId,
                        Sasia = kerkuar,
                        CmimiNjesi = cmimiNjesi,
                        CmimiTotal = cmimiTotal
                    });

                    detajResponses.Add(new KonfirmoShitjeDetajResponse(
                        detajId,
                        p.ProduktId,
                        p.Emri,
                        kerkuar,
                        cmimiNjesi,
                        cmimiTotal));
                }

                await db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);

                var response = new KonfirmoShitjeResponse(
                    shitjeId,
                    shumaParaZbritjes,
                    request.Zbritja,
                    shumaTotale,
                    detajResponses);

                return (response, (string?)null, StatusCodes.Status200OK);
            }
            catch
            {
                await tx.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }
}
