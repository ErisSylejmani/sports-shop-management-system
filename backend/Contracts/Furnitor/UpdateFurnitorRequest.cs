namespace backend.Contracts.Furnitor;

public sealed record UpdateFurnitorRequest(
    string Emri,
    string? PersoniKontaktit,
    string? Telefoni,
    string? Email,
    string? Adresa,
    string? Qyteti,
    string? Shteti);
