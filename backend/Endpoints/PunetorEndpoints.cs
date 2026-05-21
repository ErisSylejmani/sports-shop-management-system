using backend.Contracts.Punetor;
using backend.Data;
using backend.Services;
using Microsoft.AspNetCore.Identity;
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
        var userIdsByPunetor = await db.Users
            .AsNoTracking()
            .Where(u => u.PunetorId != null)
            .ToDictionaryAsync(u => u.PunetorId!.Value, u => u.Id);

        var punetoret = await db.Punetoret
            .AsNoTracking()
            .OrderBy(p => p.Mbiemri)
            .ThenBy(p => p.Emri)
            .ToListAsync();

        var items = punetoret
            .Select(p => PunetorService.ToResponse(
                p,
                userIdsByPunetor.GetValueOrDefault(p.PunetorId)))
            .ToList();

        return Results.Ok(items);
    }

    private static async Task<IResult> GetByIdAsync(Guid id, AppDbContext db)
    {
        var p = await db.Punetoret.AsNoTracking().FirstOrDefaultAsync(x => x.PunetorId == id);
        if (p is null)
            return Results.NotFound(new { message = "Punëtori nuk u gjet." });

        var userId = await db.Users
            .AsNoTracking()
            .Where(u => u.PunetorId == id)
            .Select(u => (Guid?)u.Id)
            .FirstOrDefaultAsync();

        return Results.Ok(PunetorService.ToResponse(p, userId));
    }

    private static async Task<IResult> CreateAsync(
        CreatePunetorRequest body,
        PunetorService service,
        CancellationToken cancellationToken)
    {
        var (response, error, statusCode) = await service.CreateWithLoginAsync(body, cancellationToken);
        if (response is null)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.Created($"/api/punetoret/{response.PunetorId}", response);
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

        var linkedUser = await db.Users.FirstOrDefaultAsync(u => u.PunetorId == id);
        if (linkedUser is not null)
        {
            linkedUser.Emri = entity.Emri;
            linkedUser.Mbiemri = entity.Mbiemri;
            linkedUser.PhoneNumber = entity.Telefoni;
        }

        await db.SaveChangesAsync();

        return Results.Ok(PunetorService.ToResponse(entity, linkedUser?.Id));
    }

    private static async Task<IResult> DeleteAsync(Guid id, AppDbContext db, UserManager<ApplicationUser> userManager)
    {
        var entity = await db.Punetoret.FirstOrDefaultAsync(p => p.PunetorId == id);
        if (entity is null)
            return Results.NotFound(new { message = "Punëtori nuk u gjet." });

        if (await db.Shitjet.AnyAsync(s => s.PunetorId == id))
            return Results.Conflict(new { message = "Nuk mund të fshihet: ka shitje të lidhura." });

        var linkedUser = await db.Users.FirstOrDefaultAsync(u => u.PunetorId == id);
        if (linkedUser is not null)
        {
            var deleteUser = await userManager.DeleteAsync(linkedUser);
            if (!deleteUser.Succeeded)
                return Results.BadRequest(new { message = "Nuk mund të fshihet punëtori: fshirja e llogarisë dështoi." });
        }

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

    private static string? TrimOrNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
