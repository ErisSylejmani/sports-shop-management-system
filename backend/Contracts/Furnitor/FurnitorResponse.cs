namespace backend.Contracts.Furnitor;

public sealed record FurnitorResponse(
    Guid FurnitorId,
    string Emri,
    string? PersoniKontaktit,
    string? Telefoni,
    string? Email,
    string? Adresa,
    string? Qyteti,
    string? Shteti);
