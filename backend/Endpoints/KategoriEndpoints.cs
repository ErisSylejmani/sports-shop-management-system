using backend.Contracts.Kategori;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Endpoints;

public static class KategoriEndpoints
{
    public const string KategoriShkrimPolicy = "KategoriShkrim";

    public static IEndpointRouteBuilder MapKategoriteEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/kategorite").WithTags("Kategorite");

        group.MapGet("", ListAsync).RequireAuthorization();
        group.MapGet("{id:guid}", GetByIdAsync).RequireAuthorization();
        group.MapPost("", CreateAsync).RequireAuthorization(KategoriShkrimPolicy);
        group.MapPut("{id:guid}", UpdateAsync).RequireAuthorization(KategoriShkrimPolicy);
        group.MapDelete("{id:guid}", DeleteAsync).RequireAuthorization(KategoriShkrimPolicy);

        return routes;
    }

    private static async Task<IResult> ListAsync(AppDbContext db)
    {
        var items = await db.Kategorite
            .AsNoTracking()
            .OrderBy(k => k.Emri)
            .Select(k => new KategoriResponse(k.KategoriId, k.Emri, k.Pershkrimi, k.KategoriaPrindId))
            .ToListAsync();

        return Results.Ok(items);
    }

    private static async Task<IResult> GetByIdAsync(Guid id, AppDbContext db)
    {
        var k = await db.Kategorite.AsNoTracking().FirstOrDefaultAsync(x => x.KategoriId == id);
        if (k is null)
            return Results.NotFound(new { message = "Kategoria nuk u gjet." });

        return Results.Ok(new KategoriResponse(k.KategoriId, k.Emri, k.Pershkrimi, k.KategoriaPrindId));
    }

    private static async Task<IResult> CreateAsync(CreateKategoriRequest body, AppDbContext db)
    {
        var emri = body.Emri.Trim();
        if (emri.Length == 0)
            return Results.BadRequest(new { message = "Emri i kategorisë është i detyrueshëm." });

        if (body.KategoriaPrindId is { } prindId)
        {
            var prindEkziston = await db.Kategorite.AnyAsync(k => k.KategoriId == prindId);
            if (!prindEkziston)
                return Results.BadRequest(new { message = "Kategoria prind nuk ekziston." });
        }

        var entity = new Kategori
        {
            KategoriId = Guid.NewGuid(),
            Emri = emri,
            Pershkrimi = string.IsNullOrWhiteSpace(body.Pershkrimi) ? null : body.Pershkrimi.Trim(),
            KategoriaPrindId = body.KategoriaPrindId
        };

        db.Kategorite.Add(entity);
        await db.SaveChangesAsync();

        return Results.Created(
            $"/api/kategorite/{entity.KategoriId}",
            new KategoriResponse(entity.KategoriId, entity.Emri, entity.Pershkrimi, entity.KategoriaPrindId));
    }

    private static async Task<IResult> UpdateAsync(Guid id, UpdateKategoriRequest body, AppDbContext db)
    {
        var entity = await db.Kategorite.FirstOrDefaultAsync(k => k.KategoriId == id);
        if (entity is null)
            return Results.NotFound(new { message = "Kategoria nuk u gjet." });

        var emri = body.Emri.Trim();
        if (emri.Length == 0)
            return Results.BadRequest(new { message = "Emri i kategorisë është i detyrueshëm." });

        if (body.KategoriaPrindId == id)
            return Results.BadRequest(new { message = "Kategoria nuk mund të jetë prind i vetes." });

        if (body.KategoriaPrindId is { } prindId)
        {
            var prindEkziston = await db.Kategorite.AnyAsync(k => k.KategoriId == prindId);
            if (!prindEkziston)
                return Results.BadRequest(new { message = "Kategoria prind nuk ekziston." });

            var walker = (Guid?)prindId;
            while (walker is not null)
            {
                if (walker.Value == id)
                    return Results.BadRequest(new { message = "Cikël i pamundur në hierarki." });

                walker = await db.Kategorite
                    .AsNoTracking()
                    .Where(k => k.KategoriId == walker.Value)
                    .Select(k => k.KategoriaPrindId)
                    .FirstOrDefaultAsync();
            }
        }

        entity.Emri = emri;
        entity.Pershkrimi = string.IsNullOrWhiteSpace(body.Pershkrimi) ? null : body.Pershkrimi.Trim();
        entity.KategoriaPrindId = body.KategoriaPrindId;

        await db.SaveChangesAsync();

        return Results.Ok(new KategoriResponse(entity.KategoriId, entity.Emri, entity.Pershkrimi, entity.KategoriaPrindId));
    }

    private static async Task<IResult> DeleteAsync(Guid id, AppDbContext db)
    {
        var entity = await db.Kategorite.FirstOrDefaultAsync(k => k.KategoriId == id);
        if (entity is null)
            return Results.NotFound(new { message = "Kategoria nuk u gjet." });

        var kaNen = await db.Kategorite.AnyAsync(k => k.KategoriaPrindId == id);
        if (kaNen)
            return Results.Conflict(new { message = "Nuk mund të fshihet: ka nën-kategori." });

        var kaProdukte = await db.Produktet.AnyAsync(p => p.KategoriId == id);
        if (kaProdukte)
            return Results.Conflict(new { message = "Nuk mund të fshihet: ka produkte të lidhura." });

        db.Kategorite.Remove(entity);
        await db.SaveChangesAsync();

        return Results.NoContent();
    }
}
