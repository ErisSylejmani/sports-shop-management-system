namespace backend.Contracts.Admin;

public sealed record AdminUserDetailDto(
    Guid Id,
    string? Email,
    string Emri,
    string Mbiemri,
    string? PhoneNumber,
    bool EshteAktiv,
    bool EmailConfirmed,
    DateTime DataKrijimit,
    bool LockoutEnabled,
    DateTimeOffset? LockoutEnd,
    int AccessFailedCount,
    IReadOnlyList<string> Roles);
