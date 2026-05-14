using backend.Contracts.Furnitor;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Endpoints;

public static class FurnitorEndpoints
{
    public const string FurnitorShkrimPolicy = "FurnitorShkrim";

    public static IEndpointRouteBuilder MapFurnitoreEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/furnitore").WithTags("Furnitore");

        group.MapGet("", ListAsync).RequireAuthorization();
        group.MapGet("{id:guid}", GetByIdAsync).RequireAuthorization();
        group.MapPost("", CreateAsync).RequireAuthorization(FurnitorShkrimPolicy);
        group.MapPut("{id:guid}", UpdateAsync).RequireAuthorization(FurnitorShkrimPolicy);
        group.MapDelete("{id:guid}", DeleteAsync).RequireAuthorization(FurnitorShkrimPolicy);

        return routes;
    }

    private static async Task<IResult> ListAsync(AppDbContext db)
    {
        var items = await db.Furnitoret
            .AsNoTracking()
            .OrderBy(f => f.Emri)
            .Select(f => new FurnitorResponse(
                f.FurnitorId,
                f.Emri,
                f.PersoniKontaktit,
                f.Telefoni,
                f.Email,
                f.Adresa,
                f.Qyteti,
                f.Shteti))
            .ToListAsync();

        return Results.Ok(items);
    }

    private static async Task<IResult> GetByIdAsync(Guid id, AppDbContext db)
    {
        var f = await db.Furnitoret.AsNoTracking().FirstOrDefaultAsync(x => x.FurnitorId == id);
        if (f is null)
            return Results.NotFound(new { message = "Furnitori nuk u gjet." });

        return Results.Ok(new FurnitorResponse(
            f.FurnitorId,
            f.Emri,
            f.PersoniKontaktit,
            f.Telefoni,
            f.Email,
            f.Adresa,
            f.Qyteti,
            f.Shteti));
    }

    private static async Task<IResult> CreateAsync(CreateFurnitorRequest body, AppDbContext db)
    {
        var emri = body.Emri.Trim();
        if (emri.Length == 0)
            return Results.BadRequest(new { message = "Emri i furnitorit është i detyrueshëm." });

        var entity = new Furnitor
        {
            FurnitorId = Guid.NewGuid(),
            Emri = emri,
            PersoniKontaktit = TrimOrNull(body.PersoniKontaktit),
            Telefoni = TrimOrNull(body.Telefoni),
            Email = TrimOrNull(body.Email),
            Adresa = TrimOrNull(body.Adresa),
            Qyteti = TrimOrNull(body.Qyteti),
            Shteti = TrimOrNull(body.Shteti)
        };

        db.Furnitoret.Add(entity);
        await db.SaveChangesAsync();

        return Results.Created(
            $"/api/furnitore/{entity.FurnitorId}",
            new FurnitorResponse(
                entity.FurnitorId,
                entity.Emri,
                entity.PersoniKontaktit,
                entity.Telefoni,
                entity.Email,
                entity.Adresa,
                entity.Qyteti,
                entity.Shteti));
    }

    private static async Task<IResult> UpdateAsync(Guid id, UpdateFurnitorRequest body, AppDbContext db)
    {
        var entity = await db.Furnitoret.FirstOrDefaultAsync(f => f.FurnitorId == id);
        if (entity is null)
            return Results.NotFound(new { message = "Furnitori nuk u gjet." });

        var emri = body.Emri.Trim();
        if (emri.Length == 0)
            return Results.BadRequest(new { message = "Emri i furnitorit është i detyrueshëm." });

        entity.Emri = emri;
        entity.PersoniKontaktit = TrimOrNull(body.PersoniKontaktit);
        entity.Telefoni = TrimOrNull(body.Telefoni);
        entity.Email = TrimOrNull(body.Email);
        entity.Adresa = TrimOrNull(body.Adresa);
        entity.Qyteti = TrimOrNull(body.Qyteti);
        entity.Shteti = TrimOrNull(body.Shteti);

        await db.SaveChangesAsync();

        return Results.Ok(new FurnitorResponse(
            entity.FurnitorId,
            entity.Emri,
            entity.PersoniKontaktit,
            entity.Telefoni,
            entity.Email,
            entity.Adresa,
            entity.Qyteti,
            entity.Shteti));
    }

    private static async Task<IResult> DeleteAsync(Guid id, AppDbContext db)
    {
        var entity = await db.Furnitoret.FirstOrDefaultAsync(f => f.FurnitorId == id);
        if (entity is null)
            return Results.NotFound(new { message = "Furnitori nuk u gjet." });

        if (await db.PorositFurnitoreve.AnyAsync(p => p.FurnitorId == id))
            return Results.Conflict(new { message = "Nuk mund të fshihet: ka porosi të lidhura." });

        db.Furnitoret.Remove(entity);
        await db.SaveChangesAsync();

        return Results.NoContent();
    }

    private static string? TrimOrNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
