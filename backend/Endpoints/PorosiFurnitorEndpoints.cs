using backend.Contracts.PorosiFurnitori;
using backend.Data;
using backend.Services;
using Microsoft.EntityFrameworkCore;

namespace backend.Endpoints;

public static class PorosiFurnitorEndpoints
{
    public const string PorosiFurnitorShkrimPolicy = "PorosiFurnitorShkrim";

    public static IEndpointRouteBuilder MapPorosiFurnitoreEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/porosi-furnitore").WithTags("Porosi furnitori");

        group.MapGet("", ListAsync).RequireAuthorization();
        group.MapGet("{id:guid}", GetByIdAsync).RequireAuthorization();
        group.MapPost("", CreateAsync).RequireAuthorization(PorosiFurnitorShkrimPolicy);
        group.MapPut("{id:guid}", UpdateAsync).RequireAuthorization(PorosiFurnitorShkrimPolicy);
        group.MapDelete("{id:guid}", DeleteAsync).RequireAuthorization(PorosiFurnitorShkrimPolicy);

        return routes;
    }

    private static async Task<IResult> ListAsync(AppDbContext db, Guid? furnitorId)
    {
        var query = db.PorositFurnitoreve.AsNoTracking().AsQueryable();
        if (furnitorId is not null)
            query = query.Where(p => p.FurnitorId == furnitorId.Value);

        var items = await query
            .OrderByDescending(p => p.DataPorosise)
            .Join(
                db.Furnitoret.AsNoTracking(),
                p => p.FurnitorId,
                f => f.FurnitorId,
                (p, f) => new PorosiFurnitorSummaryResponse(
                    p.PorosiId,
                    p.FurnitorId,
                    f.Emri,
                    p.DataPorosise,
                    p.DataPritshme,
                    p.ShumaTotale,
                    p.Statusi))
            .ToListAsync();

        return Results.Ok(items);
    }

    private static async Task<IResult> GetByIdAsync(Guid id, PorosiFurnitorService service, CancellationToken ct)
    {
        var detail = await service.GetDetailAsync(id, ct);
        if (detail is null)
            return Results.NotFound(new { message = "Porosia nuk u gjet." });

        return Results.Ok(detail);
    }

    private static async Task<IResult> CreateAsync(
        CreatePorosiFurnitorRequest body,
        PorosiFurnitorService service,
        CancellationToken ct)
    {
        var (response, error, statusCode) = await service.CreateAsync(body, ct);
        if (response is null)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.Created($"/api/porosi-furnitore/{response.PorosiId}", response);
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        UpdatePorosiFurnitorRequest body,
        PorosiFurnitorService service,
        CancellationToken ct)
    {
        var (response, error, statusCode) = await service.UpdateAsync(id, body, ct);
        if (response is null)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.Ok(response);
    }

    private static async Task<IResult> DeleteAsync(Guid id, AppDbContext db, CancellationToken ct)
    {
        var porosi = await db.PorositFurnitoreve.FirstOrDefaultAsync(p => p.PorosiId == id, ct);
        if (porosi is null)
            return Results.NotFound(new { message = "Porosia nuk u gjet." });

        db.PorositFurnitoreve.Remove(porosi);
        await db.SaveChangesAsync(ct);

        return Results.NoContent();
    }
}
