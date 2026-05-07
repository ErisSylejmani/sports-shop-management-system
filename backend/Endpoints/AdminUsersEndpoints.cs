using System.Security.Claims;
using backend.Contracts.Admin;
using backend.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Endpoints;

public static class AdminUsersEndpoints
{
    public static IEndpointRouteBuilder MapAdminUsersEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/admin/users")
            .RequireAuthorization(policy => policy.RequireRole("Admin"))
            .WithTags("Admin - Users");

        group.MapGet("", ListAsync);
        group.MapGet("{id:guid}", GetByIdAsync);
        group.MapPost("", CreateAsync);
        group.MapPut("{id:guid}", UpdateAsync);
        group.MapDelete("{id:guid}", DeleteAsync);
        group.MapPost("{id:guid}/roles", AddRoleAsync);
        group.MapDelete("{id:guid}/roles/{roleName}", RemoveRoleAsync);

        return routes;
    }

    private static async Task<IResult> ListAsync(
        UserManager<ApplicationUser> userManager,
        int page = 1,
        int pageSize = 20)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var query = userManager.Users.AsNoTracking().OrderBy(u => u.Email);
        var total = await query.CountAsync();
        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = new List<AdminUserListItemDto>(users.Count);
        foreach (var u in users)
        {
            var roles = await userManager.GetRolesAsync(u);
            items.Add(new AdminUserListItemDto(
                u.Id,
                u.Email,
                u.Emri,
                u.Mbiemri,
                u.PhoneNumber,
                u.EshteAktiv,
                u.DataKrijimit,
                roles.ToList()));
        }

        return Results.Ok(new AdminUsersListResponse(items, total, page, pageSize));
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        UserManager<ApplicationUser> userManager)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null)
            return Results.NotFound(new { message = "Përdoruesi nuk u gjet." });

        var roles = await userManager.GetRolesAsync(user);
        var dto = new AdminUserDetailDto(
            user.Id,
            user.Email,
            user.Emri,
            user.Mbiemri,
            user.PhoneNumber,
            user.EshteAktiv,
            user.EmailConfirmed,
            user.DataKrijimit,
            user.LockoutEnabled,
            user.LockoutEnd,
            user.AccessFailedCount,
            roles.ToList());

        return Results.Ok(dto);
    }

    private static async Task<IResult> CreateAsync(
        AdminCreateUserRequest body,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<Guid>> roleManager)
    {
        var email = body.Email.Trim();
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            Emri = body.Emri.Trim(),
            Mbiemri = body.Mbiemri.Trim(),
            PhoneNumber = string.IsNullOrWhiteSpace(body.PhoneNumber) ? null : body.PhoneNumber.Trim(),
            EmailConfirmed = true,
            EshteAktiv = body.EshteAktiv,
            DataKrijimit = DateTime.UtcNow
        };

        var createResult = await userManager.CreateAsync(user, body.Password);
        if (!createResult.Succeeded)
        {
            return Results.BadRequest(new
            {
                message = "Krijimi i përdoruesit dështoi.",
                errors = createResult.Errors.Select(e => e.Description).ToArray()
            });
        }

        var roleNames = body.RoleNames is { Count: > 0 }
            ? body.RoleNames.Select(r => r.Trim()).Where(r => r.Length > 0).Distinct().ToList()
            : new List<string> { "User" };

        foreach (var roleName in roleNames)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await userManager.DeleteAsync(user);
                return Results.BadRequest(new { message = $"Roli '{roleName}' nuk ekziston." });
            }
        }

        var roleResult = await userManager.AddToRolesAsync(user, roleNames);
        if (!roleResult.Succeeded)
        {
            await userManager.DeleteAsync(user);
            return Results.BadRequest(new
            {
                message = "Caktimi i roleve dështoi.",
                errors = roleResult.Errors.Select(e => e.Description).ToArray()
            });
        }

        var roles = await userManager.GetRolesAsync(user);
        var dto = new AdminUserDetailDto(
            user.Id,
            user.Email,
            user.Emri,
            user.Mbiemri,
            user.PhoneNumber,
            user.EshteAktiv,
            user.EmailConfirmed,
            user.DataKrijimit,
            user.LockoutEnabled,
            user.LockoutEnd,
            user.AccessFailedCount,
            roles.ToList());

        return Results.Created($"/api/admin/users/{user.Id}", dto);
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        AdminUpdateUserRequest body,
        UserManager<ApplicationUser> userManager)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null)
            return Results.NotFound(new { message = "Përdoruesi nuk u gjet." });

        user.Emri = body.Emri.Trim();
        user.Mbiemri = body.Mbiemri.Trim();
        user.PhoneNumber = string.IsNullOrWhiteSpace(body.PhoneNumber) ? null : body.PhoneNumber.Trim();
        user.EshteAktiv = body.EshteAktiv;

        var newEmail = body.Email.Trim();
        if (!string.Equals(user.Email, newEmail, StringComparison.OrdinalIgnoreCase))
        {
            var token = await userManager.GenerateChangeEmailTokenAsync(user, newEmail);
            var emailResult = await userManager.ChangeEmailAsync(user, newEmail, token);
            if (!emailResult.Succeeded)
            {
                return Results.BadRequest(new
                {
                    message = "Ndryshimi i email-it dështoi.",
                    errors = emailResult.Errors.Select(e => e.Description).ToArray()
                });
            }

            await userManager.SetUserNameAsync(user, newEmail);
        }

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return Results.BadRequest(new
            {
                message = "Përditësimi dështoi.",
                errors = updateResult.Errors.Select(e => e.Description).ToArray()
            });
        }

        var roles = await userManager.GetRolesAsync(user);
        var dto = new AdminUserDetailDto(
            user.Id,
            user.Email,
            user.Emri,
            user.Mbiemri,
            user.PhoneNumber,
            user.EshteAktiv,
            user.EmailConfirmed,
            user.DataKrijimit,
            user.LockoutEnabled,
            user.LockoutEnd,
            user.AccessFailedCount,
            roles.ToList());

        return Results.Ok(dto);
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        UserManager<ApplicationUser> userManager,
        HttpContext httpContext)
    {
        var currentIdClaim = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (currentIdClaim is not null && Guid.TryParse(currentIdClaim, out var currentId) && currentId == id)
        {
            return Results.BadRequest(new { message = "Nuk mund të fshish llogarinë tënde nga ky endpoint." });
        }

        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null)
            return Results.NotFound(new { message = "Përdoruesi nuk u gjet." });

        var deleteResult = await userManager.DeleteAsync(user);
        if (!deleteResult.Succeeded)
        {
            return Results.BadRequest(new
            {
                message = "Fshirja dështoi.",
                errors = deleteResult.Errors.Select(e => e.Description).ToArray()
            });
        }

        return Results.NoContent();
    }

    private static async Task<IResult> AddRoleAsync(
        Guid id,
        AdminUserRoleRequest body,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<Guid>> roleManager)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null)
            return Results.NotFound(new { message = "Përdoruesi nuk u gjet." });

        var roleName = body.RoleName.Trim();
        if (roleName.Length == 0)
            return Results.BadRequest(new { message = "Emri i rolit është i detyrueshëm." });

        if (!await roleManager.RoleExistsAsync(roleName))
            return Results.NotFound(new { message = $"Roli '{roleName}' nuk ekziston." });

        if (await userManager.IsInRoleAsync(user, roleName))
            return Results.Conflict(new { message = $"Përdoruesi e ka tashmë rolin '{roleName}'." });

        var addResult = await userManager.AddToRoleAsync(user, roleName);
        if (!addResult.Succeeded)
        {
            return Results.BadRequest(new
            {
                message = "Caktimi i rolit dështoi.",
                errors = addResult.Errors.Select(e => e.Description).ToArray()
            });
        }

        var roles = await userManager.GetRolesAsync(user);
        return Results.Ok(new { user.Id, Roles = roles.ToList() });
    }

    private static async Task<IResult> RemoveRoleAsync(
        Guid id,
        string roleName,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<Guid>> roleManager,
        HttpContext httpContext)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null)
            return Results.NotFound(new { message = "Përdoruesi nuk u gjet." });

        roleName = roleName.Trim();
        if (roleName.Length == 0)
            return Results.BadRequest(new { message = "Emri i rolit është i detyrueshëm." });

        if (!await roleManager.RoleExistsAsync(roleName))
            return Results.NotFound(new { message = $"Roli '{roleName}' nuk ekziston." });

        if (!await userManager.IsInRoleAsync(user, roleName))
            return Results.BadRequest(new { message = $"Përdoruesi nuk e ka rolin '{roleName}'." });

        var currentIdClaim = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.Equals(roleName, "Admin", StringComparison.OrdinalIgnoreCase) &&
            currentIdClaim is not null &&
            Guid.TryParse(currentIdClaim, out var currentId) &&
            currentId == id)
        {
            return Results.BadRequest(new { message = "Nuk mund të heqësh rolin 'Admin' nga vetja." });
        }

        var removeResult = await userManager.RemoveFromRoleAsync(user, roleName);
        if (!removeResult.Succeeded)
        {
            return Results.BadRequest(new
            {
                message = "Heqja e rolit dështoi.",
                errors = removeResult.Errors.Select(e => e.Description).ToArray()
            });
        }

        var roles = await userManager.GetRolesAsync(user);
        return Results.Ok(new { user.Id, Roles = roles.ToList() });
    }
}
