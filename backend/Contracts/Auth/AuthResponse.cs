namespace backend.Contracts.Auth;

public sealed record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTimeOffset AccessTokenExpiresAt,
    DateTimeOffset RefreshTokenExpiresAt,
    Guid UserId,
    string Email,
    string Emri,
    string Mbiemri,
    IReadOnlyList<string> Roles);
