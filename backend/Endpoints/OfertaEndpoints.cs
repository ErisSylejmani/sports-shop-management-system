using backend.Contracts.Oferta;
using backend.Data;
using backend.Services;
using Microsoft.EntityFrameworkCore;

namespace backend.Endpoints;

public static class OfertaEndpoints
{
    public const string OfertaShkrimPolicy = "OfertaShkrim";

    public static IEndpointRouteBuilder MapOfertatEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/ofertat").WithTags("Ofertat");

        group.MapGet("", ListAsync).RequireAuthorization();
        group.MapGet("{id:guid}", GetByIdAsync).RequireAuthorization();
        group.MapPost("", CreateAsync).RequireAuthorization(OfertaShkrimPolicy);
        group.MapPut("{id:guid}", UpdateAsync).RequireAuthorization(OfertaShkrimPolicy);
        group.MapDelete("{id:guid}", DeleteAsync).RequireAuthorization(OfertaShkrimPolicy);

        var produktGroup = group.MapGroup("/{ofertaId:guid}/produktet");

        produktGroup.MapGet("", ListProduktetAsync).RequireAuthorization();
        produktGroup.MapPut("", ReplaceProduktetAsync).RequireAuthorization(OfertaShkrimPolicy);
        produktGroup.MapPost("", AddProduktAsync).RequireAuthorization(OfertaShkrimPolicy);
        produktGroup.MapDelete("{oferteProduktId:guid}", RemoveProduktAsync).RequireAuthorization(OfertaShkrimPolicy);

        return routes;
    }

    private static async Task<IResult> ListAsync(
        AppDbContext db,
        string? statusi,
        bool? aktive)
    {
        var query = db.Ofertat.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(statusi))
        {
            var s = statusi.Trim();
            query = query.Where(o => o.Statusi == s);
        }

        var now = DateTime.UtcNow;
        if (aktive == true)
            query = query.Where(o => o.DataFillimit <= now && o.DataPerfundimit >= now);
        else if (aktive == false)
            query = query.Where(o => o.DataFillimit > now || o.DataPerfundimit < now);

        var items = await query
            .OrderByDescending(o => o.DataFillimit)
            .Select(o => new OfertaSummaryResponse(
                o.OfertaId,
                o.Emri,
                o.PerqindjaZbritjes,
                o.DataFillimit,
                o.DataPerfundimit,
                o.Statusi,
                o.OferteProdukte.Count))
            .ToListAsync();

        return Results.Ok(items);
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        OfertaService service,
        CancellationToken cancellationToken)
    {
        var detail = await service.GetDetailAsync(id, cancellationToken);
        if (detail is null)
            return Results.NotFound(new { message = "Oferta nuk u gjet." });

        return Results.Ok(detail);
    }

    private static async Task<IResult> CreateAsync(
        CreateOfertaRequest body,
        OfertaService service,
        CancellationToken cancellationToken)
    {
        var (response, error, statusCode) = await service.CreateAsync(body, cancellationToken);
        if (response is null)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.Created($"/api/ofertat/{response.OfertaId}", response);
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        UpdateOfertaRequest body,
        OfertaService service,
        CancellationToken cancellationToken)
    {
        var (response, error, statusCode) = await service.UpdateAsync(id, body, cancellationToken);
        if (response is null)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.Ok(response);
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        OfertaService service,
        CancellationToken cancellationToken)
    {
        var (success, error, statusCode) = await service.DeleteAsync(id, cancellationToken);
        if (!success)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.NoContent();
    }

    private static async Task<IResult> ListProduktetAsync(
        Guid ofertaId,
        OfertaService service,
        CancellationToken cancellationToken)
    {
        var (items, error, statusCode) = await service.ListProduktetAsync(ofertaId, cancellationToken);
        if (items is null)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.Ok(items);
    }

    private static async Task<IResult> AddProduktAsync(
        Guid ofertaId,
        AddOferteProduktRequest body,
        OfertaService service,
        CancellationToken cancellationToken)
    {
        var (response, error, statusCode) = await service.AddProduktAsync(ofertaId, body.ProduktId, cancellationToken);
        if (response is null)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.Created($"/api/ofertat/{ofertaId}/produktet/{response.OferteProduktId}", response);
    }

    private static async Task<IResult> RemoveProduktAsync(
        Guid ofertaId,
        Guid oferteProduktId,
        OfertaService service,
        CancellationToken cancellationToken)
    {
        var (success, error, statusCode) = await service.RemoveProduktAsync(ofertaId, oferteProduktId, cancellationToken);
        if (!success)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.NoContent();
    }

    private static async Task<IResult> ReplaceProduktetAsync(
        Guid ofertaId,
        ReplaceOferteProduktRequest body,
        OfertaService service,
        CancellationToken cancellationToken)
    {
        var (response, error, statusCode) =
            await service.ReplaceProduktetAsync(ofertaId, body.ProduktIds, cancellationToken);

        if (response is null)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.Ok(response);
    }
}
