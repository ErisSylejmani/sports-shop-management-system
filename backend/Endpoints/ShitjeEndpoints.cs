using backend.Contracts.Shitje;
using backend.Data;
using backend.Services;
using Microsoft.EntityFrameworkCore;

namespace backend.Endpoints;

public static class ShitjeEndpoints
{
    public const string ShitjeShkrimPolicy = "ShitjeShkrim";

    public static IEndpointRouteBuilder MapShitjeEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/shitjet").WithTags("Shitje");

        group.MapGet("", ListAsync).RequireAuthorization();
        group.MapGet("{id:guid}", GetByIdAsync).RequireAuthorization();
        group.MapPost("", CreateAsync).RequireAuthorization(ShitjeShkrimPolicy);
        group.MapPut("{id:guid}", UpdateAsync).RequireAuthorization(ShitjeShkrimPolicy);
        group.MapDelete("{id:guid}", DeleteAsync).RequireAuthorization(ShitjeShkrimPolicy);

        group.MapPost(
                "/konfirmo",
                async Task<IResult> (
                    KonfirmoShitjeRequest body,
                    ShitjeService shitjeService,
                    CancellationToken cancellationToken) =>
                {
                    var (response, error, statusCode) =
                        await shitjeService.KonfirmoShitjeAsync(body, cancellationToken);

                    if (response is null)
                        return Results.Json(new { message = error }, statusCode: statusCode);

                    return Results.Created($"/api/shitjet/{response.ShitjeId}", response);
                })
            .RequireAuthorization(ShitjeShkrimPolicy);

        var detajGroup = group.MapGroup("/{shitjeId:guid}/detajet");

        detajGroup.MapGet("", ListDetajetAsync).RequireAuthorization();
        detajGroup.MapGet("{detajId:guid}", GetDetajAsync).RequireAuthorization();
        detajGroup.MapPut("", ReplaceDetajetAsync).RequireAuthorization(ShitjeShkrimPolicy);
        detajGroup.MapPost("", AddDetajAsync).RequireAuthorization(ShitjeShkrimPolicy);
        detajGroup.MapPut("{detajId:guid}", UpdateDetajAsync).RequireAuthorization(ShitjeShkrimPolicy);
        detajGroup.MapDelete("{detajId:guid}", DeleteDetajAsync).RequireAuthorization(ShitjeShkrimPolicy);

        return routes;
    }

    private static async Task<IResult> ListAsync(
        AppDbContext db,
        Guid? klientId,
        Guid? punetorId)
    {
        var query = db.Shitjet.AsNoTracking().AsQueryable();
        if (klientId is not null)
            query = query.Where(s => s.KlientId == klientId.Value);
        if (punetorId is not null)
            query = query.Where(s => s.PunetorId == punetorId.Value);

        var items = await (
            from s in query.OrderByDescending(s => s.DataShitjes)
            join k in db.Klientet.AsNoTracking() on s.KlientId equals k.KlientId
            join p in db.Punetoret.AsNoTracking() on s.PunetorId equals p.PunetorId
            select new ShitjeSummaryResponse(
                s.ShitjeId,
                s.KlientId,
                k.Emri + " " + k.Mbiemri,
                s.PunetorId,
                p.Emri + " " + p.Mbiemri,
                s.DataShitjes,
                s.ShumaTotale,
                s.Zbritja,
                s.MetodaPageses))
            .ToListAsync();

        return Results.Ok(items);
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        ShitjeService shitjeService,
        CancellationToken cancellationToken)
    {
        var detail = await shitjeService.GetDetailAsync(id, cancellationToken);
        if (detail is null)
            return Results.NotFound(new { message = "Shitja nuk u gjet." });

        return Results.Ok(detail);
    }

    private static async Task<IResult> CreateAsync(
        CreateShitjeRequest body,
        ShitjeService shitjeService,
        CancellationToken cancellationToken)
    {
        var (response, error, statusCode) = await shitjeService.CreateAsync(body, cancellationToken);
        if (response is null)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.Created($"/api/shitjet/{response.ShitjeId}", response);
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        UpdateShitjeRequest body,
        ShitjeService shitjeService,
        CancellationToken cancellationToken)
    {
        var (response, error, statusCode) = await shitjeService.UpdateAsync(id, body, cancellationToken);
        if (response is null)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.Ok(response);
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        ShitjeService shitjeService,
        CancellationToken cancellationToken)
    {
        var (success, error, statusCode) = await shitjeService.DeleteAsync(id, cancellationToken);
        if (!success)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.NoContent();
    }

    private static async Task<IResult> ListDetajetAsync(
        Guid shitjeId,
        ShitjeService shitjeService,
        CancellationToken cancellationToken)
    {
        var items = await shitjeService.ListDetajetAsync(shitjeId, cancellationToken);
        if (items is null)
            return Results.NotFound(new { message = "Shitja nuk u gjet." });

        return Results.Ok(items);
    }

    private static async Task<IResult> GetDetajAsync(
        Guid shitjeId,
        Guid detajId,
        ShitjeService shitjeService,
        CancellationToken cancellationToken)
    {
        var row = await shitjeService.GetDetajAsync(shitjeId, detajId, cancellationToken);
        if (row is null)
            return Results.NotFound(new { message = "Rreshti ose shitja nuk u gjet." });

        return Results.Ok(row);
    }

    private static async Task<IResult> AddDetajAsync(
        Guid shitjeId,
        AddDetajShitjeRequest body,
        ShitjeService shitjeService,
        CancellationToken cancellationToken)
    {
        var (response, error, statusCode) = await shitjeService.AddDetajAsync(shitjeId, body, cancellationToken);
        if (response is null)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.Created($"/api/shitjet/{shitjeId}/detajet/{response.DetajShitjeId}", response);
    }

    private static async Task<IResult> UpdateDetajAsync(
        Guid shitjeId,
        Guid detajId,
        UpdateDetajShitjeRequest body,
        ShitjeService shitjeService,
        CancellationToken cancellationToken)
    {
        var (response, error, statusCode) = await shitjeService.UpdateDetajAsync(shitjeId, detajId, body, cancellationToken);
        if (response is null)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.Ok(response);
    }

    private static async Task<IResult> DeleteDetajAsync(
        Guid shitjeId,
        Guid detajId,
        ShitjeService shitjeService,
        CancellationToken cancellationToken)
    {
        var (success, error, statusCode) = await shitjeService.DeleteDetajAsync(shitjeId, detajId, cancellationToken);
        if (!success)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.NoContent();
    }

    private static async Task<IResult> ReplaceDetajetAsync(
        Guid shitjeId,
        ReplaceShitjeDetajetRequest body,
        ShitjeService shitjeService,
        CancellationToken cancellationToken)
    {
        var (response, error, statusCode) = await shitjeService.ReplaceDetajetAsync(shitjeId, body, cancellationToken);
        if (response is null)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.Ok(response);
    }
}
