using backend.Contracts.Klient;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Endpoints;

public static class KlientEndpoints
{
    public const string KlientShkrimPolicy = "KlientShkrim";

    public static IEndpointRouteBuilder MapKlientetEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/klientet").WithTags("Klientet");

        group.MapGet("", ListAsync).RequireAuthorization();
        group.MapGet("{id:guid}", GetByIdAsync).RequireAuthorization();
        group.MapPost("", CreateAsync).RequireAuthorization(KlientShkrimPolicy);
        group.MapPut("{id:guid}", UpdateAsync).RequireAuthorization(KlientShkrimPolicy);
        group.MapDelete("{id:guid}", DeleteAsync).RequireAuthorization(KlientShkrimPolicy);

        return routes;
    }

    private static async Task<IResult> ListAsync(AppDbContext db)
    {
        var items = await db.Klientet
            .AsNoTracking()
            .OrderBy(k => k.Mbiemri)
            .ThenBy(k => k.Emri)
            .Select(k => new KlientResponse(
                k.KlientId,
                k.Emri,
                k.Mbiemri,
                k.Telefoni,
                k.Email,
                k.Adresa,
                k.DataRegjistrimit,
                k.PiketBesnikerise))
            .ToListAsync();

        return Results.Ok(items);
    }

    private static async Task<IResult> GetByIdAsync(Guid id, AppDbContext db)
    {
        var k = await db.Klientet.AsNoTracking().FirstOrDefaultAsync(x => x.KlientId == id);
        if (k is null)
            return Results.NotFound(new { message = "Klienti nuk u gjet." });

        return Results.Ok(ToResponse(k));
    }

    private static async Task<IResult> CreateAsync(CreateKlientRequest body, AppDbContext db)
    {
        var emri = body.Emri.Trim();
        var mbiemri = body.Mbiemri.Trim();
        if (emri.Length == 0)
            return Results.BadRequest(new { message = "Emri është i detyrueshëm." });
        if (mbiemri.Length == 0)
            return Results.BadRequest(new { message = "Mbiemri është i detyrueshëm." });
        if (body.PiketBesnikerise < 0)
            return Results.BadRequest(new { message = "Pikët e besnikërisë nuk mund të jenë negative." });

        var entity = new Klient
        {
            KlientId = Guid.NewGuid(),
            Emri = emri,
            Mbiemri = mbiemri,
            Telefoni = TrimOrNull(body.Telefoni),
            Email = TrimOrNull(body.Email),
            Adresa = TrimOrNull(body.Adresa),
            DataRegjistrimit = body.DataRegjistrimit ?? DateTime.UtcNow,
            PiketBesnikerise = body.PiketBesnikerise
        };

        db.Klientet.Add(entity);
        await db.SaveChangesAsync();

        return Results.Created($"/api/klientet/{entity.KlientId}", ToResponse(entity));
    }

    private static async Task<IResult> UpdateAsync(Guid id, UpdateKlientRequest body, AppDbContext db)
    {
        var entity = await db.Klientet.FirstOrDefaultAsync(k => k.KlientId == id);
        if (entity is null)
            return Results.NotFound(new { message = "Klienti nuk u gjet." });

        var emri = body.Emri.Trim();
        var mbiemri = body.Mbiemri.Trim();
        if (emri.Length == 0)
            return Results.BadRequest(new { message = "Emri është i detyrueshëm." });
        if (mbiemri.Length == 0)
            return Results.BadRequest(new { message = "Mbiemri është i detyrueshëm." });
        if (body.PiketBesnikerise < 0)
            return Results.BadRequest(new { message = "Pikët e besnikërisë nuk mund të jenë negative." });

        entity.Emri = emri;
        entity.Mbiemri = mbiemri;
        entity.Telefoni = TrimOrNull(body.Telefoni);
        entity.Email = TrimOrNull(body.Email);
        entity.Adresa = TrimOrNull(body.Adresa);
        entity.PiketBesnikerise = body.PiketBesnikerise;

        await db.SaveChangesAsync();

        return Results.Ok(ToResponse(entity));
    }

    private static async Task<IResult> DeleteAsync(Guid id, AppDbContext db)
    {
        var entity = await db.Klientet.FirstOrDefaultAsync(k => k.KlientId == id);
        if (entity is null)
            return Results.NotFound(new { message = "Klienti nuk u gjet." });

        if (await db.Shitjet.AnyAsync(s => s.KlientId == id))
            return Results.Conflict(new { message = "Nuk mund të fshihet: ka shitje të lidhura." });

        db.Klientet.Remove(entity);
        await db.SaveChangesAsync();

        return Results.NoContent();
    }

    private static KlientResponse ToResponse(Klient k) =>
        new(
            k.KlientId,
            k.Emri,
            k.Mbiemri,
            k.Telefoni,
            k.Email,
            k.Adresa,
            k.DataRegjistrimit,
            k.PiketBesnikerise);

    private static string? TrimOrNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
