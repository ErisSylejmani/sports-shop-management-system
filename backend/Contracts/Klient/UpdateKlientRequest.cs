namespace backend.Contracts.Klient;

public sealed record UpdateKlientRequest(
    string Emri,
    string Mbiemri,
    string? Telefoni,
    string? Email,
    string? Adresa,
    int PiketBesnikerise);
