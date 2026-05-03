using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services;

public sealed class AccessTokenService(IConfiguration configuration)
{
    // B7: NameIdentifier, email (JWT "email"), ClaimTypes.Role për çdo rol; plus sub, jti.
    public (string Token, DateTimeOffset ExpiresAt) CreateAccessToken(ApplicationUser user, IList<string> roles)
    {
        var jwt = configuration.GetSection("Jwt");
        var signingKey = jwt["SigningKey"]
            ?? throw new InvalidOperationException("Jwt:SigningKey mungon.");
        var issuer = jwt["Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer mungon.");
        var audience = jwt["Audience"] ?? throw new InvalidOperationException("Jwt:Audience mungon.");
        var expiryMinutes = int.TryParse(jwt["ExpiryMinutes"], out var m) ? m : 60;

        var claims = BuildClaims(user, roles);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(expiryMinutes);

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        var handler = new JwtSecurityTokenHandler();
        return (handler.WriteToken(token), expiresAt);
    }

    private static List<Claim> BuildClaims(ApplicationUser user, IList<string> roles)
    {
        var email = user.Email ?? string.Empty;
        var userId = user.Id.ToString();

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId),
            new(ClaimTypes.NameIdentifier, userId),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        return claims;
    }

    public static string CreateRefreshTokenValue()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return WebEncoders.Base64UrlEncode(bytes);
    }
}
