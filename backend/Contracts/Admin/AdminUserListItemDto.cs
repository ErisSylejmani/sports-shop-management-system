namespace backend.Contracts.Admin;

public sealed record AdminUserListItemDto(
    Guid Id,
    string? Email,
    string Emri,
    string Mbiemri,
    string? PhoneNumber,
    bool EshteAktiv,
    DateTime DataKrijimit,
    IReadOnlyList<string> Roles);
