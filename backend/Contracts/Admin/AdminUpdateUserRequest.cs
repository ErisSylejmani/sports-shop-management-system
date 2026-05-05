namespace backend.Contracts.Admin;

public sealed record AdminUpdateUserRequest(
    string Emri,
    string Mbiemri,
    string Email,
    string? PhoneNumber,
    bool EshteAktiv);
