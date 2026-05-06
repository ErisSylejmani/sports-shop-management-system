using backend.Contracts.Admin;
using backend.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Endpoints;

public static class AdminRolesEndpoints
{
    public static IEndpointRouteBuilder MapAdminRolesEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/admin/roles")
            .RequireAuthorization(policy => policy.RequireRole("Admin"))
            .WithTags("Admin - Roles");

        group.MapGet("", ListAsync);
        group.MapPost("", CreateAsync);
        group.MapPut("{id:guid}", UpdateAsync);
        group.MapDelete("{id:guid}", DeleteAsync);

        return routes;
    }

    private static async Task<IResult> ListAsync(RoleManager<IdentityRole<Guid>> roleManager)
    {
        var roles = await roleManager.Roles
            .AsNoTracking()
            .OrderBy(r => r.Name)
            .Select(r => new
            {
                r.Id,
                r.Name,
                r.NormalizedName
            })
            .ToListAsync();

        return Results.Ok(roles);
    }

    private static async Task<IResult> CreateAsync(
        AdminRoleRequest body,
        RoleManager<IdentityRole<Guid>> roleManager)
    {
        var name = body.Name.Trim();
        if (name.Length == 0)
            return Results.BadRequest(new { message = "Emri i rolit është i detyrueshëm." });

        var existing = await roleManager.FindByNameAsync(name);
        if (existing is not null)
            return Results.Conflict(new { message = "Roli ekziston." });

        var role = new IdentityRole<Guid>(name);
        var result = await roleManager.CreateAsync(role);
        if (!result.Succeeded)
        {
            return Results.BadRequest(new
            {
                message = "Krijimi i rolit dështoi.",
                errors = result.Errors.Select(e => e.Description).ToArray()
            });
        }

        return Results.Created($"/api/admin/roles/{role.Id}", new
        {
            role.Id,
            role.Name,
            role.NormalizedName
        });
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        AdminRoleRequest body,
        RoleManager<IdentityRole<Guid>> roleManager)
    {
        var role = await roleManager.FindByIdAsync(id.ToString());
        if (role is null)
            return Results.NotFound(new { message = "Roli nuk u gjet." });

        var name = body.Name.Trim();
        if (name.Length == 0)
            return Results.BadRequest(new { message = "Emri i rolit është i detyrueshëm." });

        var existing = await roleManager.FindByNameAsync(name);
        if (existing is not null && existing.Id != role.Id)
            return Results.Conflict(new { message = "Ekziston rol tjetër me këtë emër." });

        role.Name = name;
        role.NormalizedName = name.ToUpperInvariant();

        var result = await roleManager.UpdateAsync(role);
        if (!result.Succeeded)
        {
            return Results.BadRequest(new
            {
                message = "Përditësimi i rolit dështoi.",
                errors = result.Errors.Select(e => e.Description).ToArray()
            });
        }

        return Results.Ok(new
        {
            role.Id,
            role.Name,
            role.NormalizedName
        });
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        RoleManager<IdentityRole<Guid>> roleManager,
        UserManager<ApplicationUser> userManager)
    {
        var role = await roleManager.FindByIdAsync(id.ToString());
        if (role is null)
            return Results.NotFound(new { message = "Roli nuk u gjet." });

        if (string.Equals(role.Name, "Admin", StringComparison.OrdinalIgnoreCase))
            return Results.BadRequest(new { message = "Roli 'Admin' nuk mund të fshihet." });

        var roleName = role.Name ?? string.Empty;
        if (roleName.Length > 0)
        {
            var assignedUsers = await userManager.GetUsersInRoleAsync(roleName);
            if (assignedUsers.Count > 0)
                return Results.BadRequest(new { message = "Roli ka përdorues të caktuar dhe nuk mund të fshihet." });
        }

        var result = await roleManager.DeleteAsync(role);
        if (!result.Succeeded)
        {
            return Results.BadRequest(new
            {
                message = "Fshirja e rolit dështoi.",
                errors = result.Errors.Select(e => e.Description).ToArray()
            });
        }

        return Results.NoContent();
    }
}
