namespace backend.Contracts.Auth;

public sealed record RegisterResponse(
    Guid UserId,
    string Email,
    string Emri,
    string Mbiemri,
    IReadOnlyList<string> Roles);
