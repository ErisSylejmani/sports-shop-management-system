using Microsoft.AspNetCore.Identity;

namespace backend.Data;

public static class RoleSeeder
{
    private static readonly string[] DefaultRoleNames = ["Admin", "Manager", "User"];

    // Idempotent: nëse roli ekziston, anashkalohet.
    public static async Task SeedDefaultRolesAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        foreach (var roleName in DefaultRoleNames)
        {
            if (await roleManager.RoleExistsAsync(roleName))
                continue;

            var role = new IdentityRole<Guid>(roleName);
            var result = await roleManager.CreateAsync(role);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Krijimi i rolit '{roleName}' dështoi: {errors}");
            }
        }
    }
}
