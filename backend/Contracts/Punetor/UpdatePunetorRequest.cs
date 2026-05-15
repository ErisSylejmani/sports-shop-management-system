namespace backend.Contracts.Punetor;

public sealed record UpdatePunetorRequest(
    string Emri,
    string Mbiemri,
    string Pozita,
    string? Telefoni,
    string? Email,
    DateTime DataPunesimit,
    decimal Paga);
