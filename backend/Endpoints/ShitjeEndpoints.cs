using backend.Contracts.Shitje;
using backend.Services;

namespace backend.Endpoints;

public static class ShitjeEndpoints
{
    public static IEndpointRouteBuilder MapShitjeEndpoints(this IEndpointRouteBuilder routes)
    {
        routes.MapPost(
                "/api/shitjet/konfirmo",
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
            .RequireAuthorization()
            .WithTags("Shitje");

        return routes;
    }
}
