using backend.Contracts.Punetor;
using backend.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public sealed class PunetorService(
    AppDbContext db,
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole<Guid>> roleManager)
{
    public async Task<(PunetorResponse? Response, string? Error, int StatusCode)> CreateWithLoginAsync(
        CreatePunetorRequest request,
        CancellationToken cancellationToken = default)
    {
        var validation = ValidateBody(request.Emri, request.Mbiemri, request.Pozita, request.Paga, request.Email, request.Password);
        if (validation is not null)
            return (null, validation, StatusCodes.Status400BadRequest);

        var email = request.Email.Trim();
        if (await userManager.FindByEmailAsync(email) is not null)
            return (null, "Ekziston tashmë një llogari me këtë email.", StatusCodes.Status409Conflict);

        if (!await roleManager.RoleExistsAsync("User"))
            return (null, "Roli 'User' (staf) nuk ekziston. Nisni API-n për seed-in e roleve.", StatusCodes.Status500InternalServerError);

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var punetorId = Guid.NewGuid();
            var punetor = new Punetor
            {
                PunetorId = punetorId,
                Emri = request.Emri.Trim(),
                Mbiemri = request.Mbiemri.Trim(),
                Pozita = request.Pozita.Trim(),
                Telefoni = TrimOrNull(request.Telefoni),
                Email = email,
                DataPunesimit = request.DataPunesimit ?? DateTime.UtcNow,
                Paga = request.Paga
            };

            db.Punetoret.Add(punetor);
            await db.SaveChangesAsync(cancellationToken);

            var applicationUser = new ApplicationUser
            {
                UserName = email,
                Email = email,
                Emri = punetor.Emri,
                Mbiemri = punetor.Mbiemri,
                PhoneNumber = punetor.Telefoni,
                EmailConfirmed = true,
                EshteAktiv = true,
                DataKrijimit = DateTime.UtcNow,
                PunetorId = punetorId
            };

            var createResult = await userManager.CreateAsync(applicationUser, request.Password);
            if (!createResult.Succeeded)
            {
                await tx.RollbackAsync(cancellationToken);
                return (
                    null,
                    "Krijimi i llogarisë dështoi: " + string.Join("; ", createResult.Errors.Select(e => e.Description)),
                    StatusCodes.Status400BadRequest);
            }

            var roleResult = await userManager.AddToRoleAsync(applicationUser, "User");
            if (!roleResult.Succeeded)
            {
                await userManager.DeleteAsync(applicationUser);
                await tx.RollbackAsync(cancellationToken);
                return (null, "Caktimi i rolit User (staf) dështoi.", StatusCodes.Status400BadRequest);
            }

            await tx.CommitAsync(cancellationToken);

            return (
                ToResponse(punetor, applicationUser.Id),
                null,
                StatusCodes.Status201Created);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public static PunetorResponse ToResponse(Punetor p, Guid? userId = null) =>
        new(
            p.PunetorId,
            p.Emri,
            p.Mbiemri,
            p.Pozita,
            p.Telefoni,
            p.Email,
            p.DataPunesimit,
            p.Paga,
            userId);

    private static string? ValidateBody(
        string emri,
        string mbiemri,
        string pozita,
        decimal paga,
        string email,
        string password)
    {
        if (string.IsNullOrWhiteSpace(emri))
            return "Emri është i detyrueshëm.";
        if (string.IsNullOrWhiteSpace(mbiemri))
            return "Mbiemri është i detyrueshëm.";
        if (string.IsNullOrWhiteSpace(pozita))
            return "Pozita është e detyrueshme.";
        if (paga < 0)
            return "Paga nuk mund të jetë negative.";
        if (string.IsNullOrWhiteSpace(email))
            return "Email-i është i detyrueshëm për llogarinë e stafit.";
        if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
            return "Fjalëkalimi duhet të ketë të paktën 8 karaktere.";

        return null;
    }

    private static string? TrimOrNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
