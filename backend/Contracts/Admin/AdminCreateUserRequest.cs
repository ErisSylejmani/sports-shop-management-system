namespace backend.Contracts.Admin;

public sealed record AdminCreateUserRequest(
    string Emri,
    string Mbiemri,
    string Email,
    string Password,
    string? PhoneNumber,
    bool EshteAktiv = true,
    IReadOnlyList<string>? RoleNames = null);
