namespace backend.Contracts.Klient;

public sealed record CreateKlientRequest(
    string Emri,
    string Mbiemri,
    string? Telefoni,
    string? Email,
    string? Adresa,
    DateTime? DataRegjistrimit,
    int PiketBesnikerise = 0);
