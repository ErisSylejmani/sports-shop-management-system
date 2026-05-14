using backend.Contracts.Produkt;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Endpoints;

public static class ProduktEndpoints
{
    public const string ProduktShkrimPolicy = "ProduktShkrim";

    public static IEndpointRouteBuilder MapProdukteEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/produkte").WithTags("Produkte");

        group.MapGet("", ListAsync).RequireAuthorization();
        group.MapGet("{id:guid}", GetByIdAsync).RequireAuthorization();
        group.MapPost("", CreateAsync).RequireAuthorization(ProduktShkrimPolicy);
        group.MapPut("{id:guid}", UpdateAsync).RequireAuthorization(ProduktShkrimPolicy);
        group.MapDelete("{id:guid}", DeleteAsync).RequireAuthorization(ProduktShkrimPolicy);

        return routes;
    }

    private static async Task<IResult> ListAsync(AppDbContext db, Guid? kategoriId)
    {
        var query = db.Produktet.AsNoTracking().AsQueryable();
        if (kategoriId is not null)
            query = query.Where(p => p.KategoriId == kategoriId.Value);

        var items = await query
            .OrderBy(p => p.Emri)
            .Join(
                db.Kategorite.AsNoTracking(),
                p => p.KategoriId,
                k => k.KategoriId,
                (p, k) => new ProduktResponse(
                    p.ProduktId,
                    p.Emri,
                    p.Pershkrimi,
                    p.KategoriId,
                    k.Emri,
                    p.Marka,
                    p.CmimiBlerjes,
                    p.CmimiShitjes,
                    p.SasiaStok,
                    p.Madhesia,
                    p.Ngjyra))
            .ToListAsync();

        return Results.Ok(items);
    }

    private static async Task<IResult> GetByIdAsync(Guid id, AppDbContext db)
    {
        var row = await (
            from p in db.Produktet.AsNoTracking()
            join k in db.Kategorite.AsNoTracking() on p.KategoriId equals k.KategoriId
            where p.ProduktId == id
            select new ProduktResponse(
                p.ProduktId,
                p.Emri,
                p.Pershkrimi,
                p.KategoriId,
                k.Emri,
                p.Marka,
                p.CmimiBlerjes,
                p.CmimiShitjes,
                p.SasiaStok,
                p.Madhesia,
                p.Ngjyra)).FirstOrDefaultAsync();

        if (row is null)
            return Results.NotFound(new { message = "Produkti nuk u gjet." });

        return Results.Ok(row);
    }

    private static async Task<IResult> CreateAsync(CreateProduktRequest body, AppDbContext db)
    {
        var err = ValidateBody(body.Emri, body.Marka, body.CmimiBlerjes, body.CmimiShitjes, body.SasiaStok);
        if (err is not null)
            return Results.BadRequest(new { message = err });

        var kategoriEkziston = await db.Kategorite.AnyAsync(k => k.KategoriId == body.KategoriId);
        if (!kategoriEkziston)
            return Results.BadRequest(new { message = "Kategoria nuk ekziston." });

        var entity = new Produkt
        {
            ProduktId = Guid.NewGuid(),
            Emri = body.Emri.Trim(),
            Pershkrimi = string.IsNullOrWhiteSpace(body.Pershkrimi) ? null : body.Pershkrimi.Trim(),
            KategoriId = body.KategoriId,
            Marka = body.Marka.Trim(),
            CmimiBlerjes = body.CmimiBlerjes,
            CmimiShitjes = body.CmimiShitjes,
            SasiaStok = body.SasiaStok,
            Madhesia = string.IsNullOrWhiteSpace(body.Madhesia) ? null : body.Madhesia.Trim(),
            Ngjyra = string.IsNullOrWhiteSpace(body.Ngjyra) ? null : body.Ngjyra.Trim()
        };

        db.Produktet.Add(entity);
        await db.SaveChangesAsync();

        var kEmri = await db.Kategorite.AsNoTracking()
            .Where(k => k.KategoriId == entity.KategoriId)
            .Select(k => k.Emri)
            .FirstAsync();

        return Results.Created(
            $"/api/produkte/{entity.ProduktId}",
            new ProduktResponse(
                entity.ProduktId,
                entity.Emri,
                entity.Pershkrimi,
                entity.KategoriId,
                kEmri,
                entity.Marka,
                entity.CmimiBlerjes,
                entity.CmimiShitjes,
                entity.SasiaStok,
                entity.Madhesia,
                entity.Ngjyra));
    }

    private static async Task<IResult> UpdateAsync(Guid id, UpdateProduktRequest body, AppDbContext db)
    {
        var entity = await db.Produktet.FirstOrDefaultAsync(p => p.ProduktId == id);
        if (entity is null)
            return Results.NotFound(new { message = "Produkti nuk u gjet." });

        var err = ValidateBody(body.Emri, body.Marka, body.CmimiBlerjes, body.CmimiShitjes, body.SasiaStok);
        if (err is not null)
            return Results.BadRequest(new { message = err });

        var kategoriEkziston = await db.Kategorite.AnyAsync(k => k.KategoriId == body.KategoriId);
        if (!kategoriEkziston)
            return Results.BadRequest(new { message = "Kategoria nuk ekziston." });

        entity.Emri = body.Emri.Trim();
        entity.Pershkrimi = string.IsNullOrWhiteSpace(body.Pershkrimi) ? null : body.Pershkrimi.Trim();
        entity.KategoriId = body.KategoriId;
        entity.Marka = body.Marka.Trim();
        entity.CmimiBlerjes = body.CmimiBlerjes;
        entity.CmimiShitjes = body.CmimiShitjes;
        entity.SasiaStok = body.SasiaStok;
        entity.Madhesia = string.IsNullOrWhiteSpace(body.Madhesia) ? null : body.Madhesia.Trim();
        entity.Ngjyra = string.IsNullOrWhiteSpace(body.Ngjyra) ? null : body.Ngjyra.Trim();

        await db.SaveChangesAsync();

        var kEmri = await db.Kategorite.AsNoTracking()
            .Where(k => k.KategoriId == entity.KategoriId)
            .Select(k => k.Emri)
            .FirstAsync();

        return Results.Ok(new ProduktResponse(
            entity.ProduktId,
            entity.Emri,
            entity.Pershkrimi,
            entity.KategoriId,
            kEmri,
            entity.Marka,
            entity.CmimiBlerjes,
            entity.CmimiShitjes,
            entity.SasiaStok,
            entity.Madhesia,
            entity.Ngjyra));
    }

    private static async Task<IResult> DeleteAsync(Guid id, AppDbContext db)
    {
        var entity = await db.Produktet.FirstOrDefaultAsync(p => p.ProduktId == id);
        if (entity is null)
            return Results.NotFound(new { message = "Produkti nuk u gjet." });

        if (await db.DetajetShitje.AnyAsync(d => d.ProduktId == id))
            return Results.Conflict(new { message = "Nuk mund të fshihet: përdoret në shitje." });

        if (await db.DetajetPorosiveFurnitor.AnyAsync(d => d.ProduktId == id))
            return Results.Conflict(new { message = "Nuk mund të fshihet: përdoret në porosi furnitori." });

        if (await db.Kthimet.AnyAsync(k => k.ProduktId == id))
            return Results.Conflict(new { message = "Nuk mund të fshihet: përdoret në kthime." });

        if (await db.OferteProdukte.AnyAsync(o => o.ProduktId == id))
            return Results.Conflict(new { message = "Nuk mund të fshihet: përdoret në oferta." });

        db.Produktet.Remove(entity);
        await db.SaveChangesAsync();

        return Results.NoContent();
    }

    private static string? ValidateBody(string emri, string marka, decimal cmimiBlerjes, decimal cmimiShitjes, int sasiaStok)
    {
        if (string.IsNullOrWhiteSpace(emri))
            return "Emri i produktit është i detyrueshëm.";
        if (string.IsNullOrWhiteSpace(marka))
            return "Marka është e detyrueshme.";
        if (cmimiBlerjes < 0 || cmimiShitjes < 0)
            return "Çmimet nuk mund të jenë negative.";
        if (sasiaStok < 0)
            return "Sasia në stok nuk mund të jetë negative.";
        return null;
    }
}
