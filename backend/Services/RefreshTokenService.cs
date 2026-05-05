using backend.Contracts.Auth;
using backend.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public sealed class RefreshTokenService(
    AppDbContext db,
    UserManager<ApplicationUser> userManager,
    AccessTokenService accessTokenService,
    IConfiguration configuration)
{
    // Revokon token-in e vjetër, krijon refresh të ri + access JWT të ri.
    public async Task<AuthResponse?> TryRefreshAsync(string refreshTokenValue, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(refreshTokenValue))
            return null;

        var trimmed = refreshTokenValue.Trim();

        var stored = await db.RefreshTokens
            .AsTracking()
            .Include(x => x.User)
            .FirstOrDefaultAsync(
                x => x.Token == trimmed && x.Revoked == null,
                cancellationToken);

        if (stored is null)
            return null;

        if (stored.Expires <= DateTime.UtcNow)
            return null;

        if (!stored.User.EshteAktiv)
            return null;

        stored.Revoked = DateTime.UtcNow;

        var newRefreshValue = AccessTokenService.CreateRefreshTokenValue();
        var refreshDays = int.TryParse(configuration["Jwt:RefreshTokenDays"], out var rd) ? rd : 7;
        var refreshExpires = DateTime.UtcNow.AddDays(refreshDays);

        db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = stored.UserId,
            Token = newRefreshValue,
            Expires = refreshExpires,
            Created = DateTime.UtcNow
        });

        var roleNames = await userManager.GetRolesAsync(stored.User);
        var (accessToken, accessExpiresAt) = accessTokenService.CreateAccessToken(stored.User, roleNames);

        await db.SaveChangesAsync(cancellationToken);

        var email = stored.User.Email ?? string.Empty;

        return new AuthResponse(
            accessToken,
            newRefreshValue,
            accessExpiresAt,
            new DateTimeOffset(refreshExpires, TimeSpan.Zero),
            stored.User.Id,
            email,
            stored.User.Emri,
            stored.User.Mbiemri,
            roleNames.ToList());
    }

    public async Task<bool> TryRevokeAsync(string refreshTokenValue, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(refreshTokenValue))
            return false;

        var trimmed = refreshTokenValue.Trim();
        var stored = await db.RefreshTokens
            .AsTracking()
            .FirstOrDefaultAsync(x => x.Token == trimmed && x.Revoked == null, cancellationToken);

        if (stored is null)
            return false;

        stored.Revoked = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
