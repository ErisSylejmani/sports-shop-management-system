using backend.Contracts.Punetor;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Endpoints;

public static class PunetorEndpoints
{
    public const string PunetorShkrimPolicy = "PunetorShkrim";

    public static IEndpointRouteBuilder MapPunetoretEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/punetoret").WithTags("Punetoret");

        group.MapGet("", ListAsync).RequireAuthorization();
        group.MapGet("{id:guid}", GetByIdAsync).RequireAuthorization();
        group.MapPost("", CreateAsync).RequireAuthorization(PunetorShkrimPolicy);
        group.MapPut("{id:guid}", UpdateAsync).RequireAuthorization(PunetorShkrimPolicy);
        group.MapDelete("{id:guid}", DeleteAsync).RequireAuthorization(PunetorShkrimPolicy);

        return routes;
    }

    private static async Task<IResult> ListAsync(AppDbContext db)
    {
        var items = await db.Punetoret
            .AsNoTracking()
            .OrderBy(p => p.Mbiemri)
            .ThenBy(p => p.Emri)
            .Select(p => new PunetorResponse(
                p.PunetorId,
                p.Emri,
                p.Mbiemri,
                p.Pozita,
                p.Telefoni,
                p.Email,
                p.DataPunesimit,
                p.Paga))
            .ToListAsync();

        return Results.Ok(items);
    }

    private static async Task<IResult> GetByIdAsync(Guid id, AppDbContext db)
    {
        var p = await db.Punetoret.AsNoTracking().FirstOrDefaultAsync(x => x.PunetorId == id);
        if (p is null)
            return Results.NotFound(new { message = "Punëtori nuk u gjet." });

        return Results.Ok(ToResponse(p));
    }

    private static async Task<IResult> CreateAsync(CreatePunetorRequest body, AppDbContext db)
    {
        var validation = ValidateBody(body.Emri, body.Mbiemri, body.Pozita, body.Paga);
        if (validation is not null)
            return Results.BadRequest(new { message = validation });

        var entity = new Punetor
        {
            PunetorId = Guid.NewGuid(),
            Emri = body.Emri.Trim(),
            Mbiemri = body.Mbiemri.Trim(),
            Pozita = body.Pozita.Trim(),
            Telefoni = TrimOrNull(body.Telefoni),
            Email = TrimOrNull(body.Email),
            DataPunesimit = body.DataPunesimit ?? DateTime.UtcNow,
            Paga = body.Paga
        };

        db.Punetoret.Add(entity);
        await db.SaveChangesAsync();

        return Results.Created($"/api/punetoret/{entity.PunetorId}", ToResponse(entity));
    }

    private static async Task<IResult> UpdateAsync(Guid id, UpdatePunetorRequest body, AppDbContext db)
    {
        var entity = await db.Punetoret.FirstOrDefaultAsync(p => p.PunetorId == id);
        if (entity is null)
            return Results.NotFound(new { message = "Punëtori nuk u gjet." });

        var validation = ValidateBody(body.Emri, body.Mbiemri, body.Pozita, body.Paga);
        if (validation is not null)
            return Results.BadRequest(new { message = validation });

        entity.Emri = body.Emri.Trim();
        entity.Mbiemri = body.Mbiemri.Trim();
        entity.Pozita = body.Pozita.Trim();
        entity.Telefoni = TrimOrNull(body.Telefoni);
        entity.Email = TrimOrNull(body.Email);
        entity.DataPunesimit = body.DataPunesimit;
        entity.Paga = body.Paga;

        await db.SaveChangesAsync();

        return Results.Ok(ToResponse(entity));
    }

    private static async Task<IResult> DeleteAsync(Guid id, AppDbContext db)
    {
        var entity = await db.Punetoret.FirstOrDefaultAsync(p => p.PunetorId == id);
        if (entity is null)
            return Results.NotFound(new { message = "Punëtori nuk u gjet." });

        if (await db.Shitjet.AnyAsync(s => s.PunetorId == id))
            return Results.Conflict(new { message = "Nuk mund të fshihet: ka shitje të lidhura." });

        db.Punetoret.Remove(entity);
        await db.SaveChangesAsync();

        return Results.NoContent();
    }

    private static string? ValidateBody(string emri, string mbiemri, string pozita, decimal paga)
    {
        if (string.IsNullOrWhiteSpace(emri))
            return "Emri është i detyrueshëm.";
        if (string.IsNullOrWhiteSpace(mbiemri))
            return "Mbiemri është i detyrueshëm.";
        if (string.IsNullOrWhiteSpace(pozita))
            return "Pozita është e detyrueshme.";
        if (paga < 0)
            return "Paga nuk mund të jetë negative.";
        return null;
    }

    private static PunetorResponse ToResponse(Punetor p) =>
        new(
            p.PunetorId,
            p.Emri,
            p.Mbiemri,
            p.Pozita,
            p.Telefoni,
            p.Email,
            p.DataPunesimit,
            p.Paga);

    private static string? TrimOrNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
