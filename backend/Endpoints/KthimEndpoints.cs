using backend.Contracts.Kthim;
using backend.Data;
using backend.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Endpoints;

public static class KthimEndpoints
{
    public const string KthimShkrimPolicy = "KthimShkrim";

    public static IEndpointRouteBuilder MapKthimetEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/kthimet").WithTags("Kthimet");

        group.MapGet("", ListAsync).RequireAuthorization();
        group.MapGet("{id:guid}", GetByIdAsync).RequireAuthorization();
        group.MapPost("", CreateAsync).RequireAuthorization(KthimShkrimPolicy);
        group.MapPut("{id:guid}", UpdateAsync).RequireAuthorization(KthimShkrimPolicy);
        group.MapDelete("{id:guid}", DeleteAsync).RequireAuthorization(KthimShkrimPolicy);

        return routes;
    }

    private static async Task<IResult> ListAsync(
        AppDbContext db,
        Guid? shitjeId,
        Guid? produktId)
    {
        var query = db.Kthimet.AsNoTracking().AsQueryable();
        if (shitjeId is not null)
            query = query.Where(k => k.ShitjeId == shitjeId.Value);
        if (produktId is not null)
            query = query.Where(k => k.ProduktId == produktId.Value);

        var items = await (
            from k in query.OrderByDescending(k => k.DataKthimit)
            join pr in db.Produktet.AsNoTracking() on k.ProduktId equals pr.ProduktId
            join s in db.Shitjet.AsNoTracking() on k.ShitjeId equals s.ShitjeId
            select new KthimResponse(
                k.KthimId,
                k.ShitjeId,
                k.ProduktId,
                pr.Emri,
                s.DataShitjes,
                k.Sasia,
                k.Arsyeja,
                k.DataKthimit,
                k.Statusi))
            .ToListAsync();

        return Results.Ok(items);
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        KthimService service,
        CancellationToken cancellationToken)
    {
        var detail = await service.GetDetailAsync(id, cancellationToken);
        if (detail is null)
            return Results.NotFound(new { message = "Kthimi nuk u gjet." });

        return Results.Ok(detail);
    }

    private static async Task<IResult> CreateAsync(
        CreateKthimRequest body,
        KthimService service,
        CancellationToken cancellationToken)
    {
        var (response, error, statusCode) = await service.CreateAsync(body, cancellationToken);
        if (response is null)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.Created($"/api/kthimet/{response.KthimId}", response);
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        UpdateKthimRequest body,
        KthimService service,
        HttpContext httpContext,
        UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken)
    {
        var (_, _, isStaffOnly) =
            await StaffAccessHelper.GetContextAsync(httpContext, userManager, cancellationToken);
        var forbidden = StaffAccessHelper.ForbidStaffMutation(isStaffOnly, "ndryshojë kthimin");
        if (forbidden is not null)
            return forbidden;

        var (response, error, statusCode) = await service.UpdateAsync(id, body, cancellationToken);
        if (response is null)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.Ok(response);
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        KthimService service,
        HttpContext httpContext,
        UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken)
    {
        var (_, _, isStaffOnly) =
            await StaffAccessHelper.GetContextAsync(httpContext, userManager, cancellationToken);
        var forbidden = StaffAccessHelper.ForbidStaffMutation(isStaffOnly, "fshijë kthimin");
        if (forbidden is not null)
            return forbidden;

        var (success, error, statusCode) = await service.DeleteAsync(id, cancellationToken);
        if (!success)
            return Results.Json(new { message = error }, statusCode: statusCode);

        return Results.NoContent();
    }
}
