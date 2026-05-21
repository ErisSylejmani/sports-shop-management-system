using backend.Contracts.Shitje;
using backend.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;

namespace backend.Services;

/// <summary>Staf = rol User pa Manager/Admin; lidhur me PunetorId.</summary>
public static class StaffAccessHelper
{
    public static async Task<(ApplicationUser? User, Guid? PunetorId, bool IsStaffOnly)> GetContextAsync(
        HttpContext httpContext,
        UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.GetUserAsync(httpContext.User);
        if (user is null)
            return (null, null, false);

        var roles = await userManager.GetRolesAsync(user);
        var isStaffOnly = roles.Contains("User")
            && !roles.Contains("Manager")
            && !roles.Contains("Admin");

        return (user, user.PunetorId, isStaffOnly);
    }

    public static (CreateShitjeRequest Request, string? Error) ApplyStaffPunetorForCreate(
        CreateShitjeRequest request,
        Guid staffPunetorId)
    {
        if (request.PunetorId != staffPunetorId)
        {
            return (request with { PunetorId = staffPunetorId }, null);
        }

        return (request, null);
    }

    public static (KonfirmoShitjeRequest Request, string? Error) ApplyStaffPunetorForKonfirmo(
        KonfirmoShitjeRequest request,
        Guid staffPunetorId)
    {
        if (request.PunetorId != staffPunetorId)
            return (request with { PunetorId = staffPunetorId }, null);

        return (request, null);
    }

    public static string? ValidateStaffCanWriteSale(bool isStaffOnly, Guid? punetorId)
    {
        if (!isStaffOnly)
            return null;

        if (punetorId is null)
            return "Llogaria e stafit nuk është e lidhur me një punëtor. Kontaktoni administratorin.";

        return null;
    }

    public static IResult? ForbidStaffMutation(bool isStaffOnly, string veprim)
    {
        if (!isStaffOnly)
            return null;

        return Results.Json(
            new { message = $"Stafi (roli User) nuk mund të {veprim}. Kontaktoni menaxherin." },
            statusCode: StatusCodes.Status403Forbidden);
    }
}
