namespace backend.Contracts.Klient;

public sealed record KlientResponse(
    Guid KlientId,
    string Emri,
    string Mbiemri,
    string? Telefoni,
    string? Email,
    string? Adresa,
    DateTime DataRegjistrimit,
    int PiketBesnikerise);
