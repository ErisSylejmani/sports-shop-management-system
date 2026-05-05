using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace backend.Swagger;

// Lidh skemën Bearer me dokumentin OpenAPI që Swagger UI të dërgojë Authorization në Try it out.
public sealed class BearerAuthDocumentFilter : IDocumentFilter
{
    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
        var schemeRef = new OpenApiSecuritySchemeReference(
            "Bearer",
            swaggerDoc,
            externalResource: null);

        swaggerDoc.Security ??= new List<OpenApiSecurityRequirement>();
        swaggerDoc.Security.Add(new OpenApiSecurityRequirement
        {
            [schemeRef] = new List<string>()
        });
    }
}
