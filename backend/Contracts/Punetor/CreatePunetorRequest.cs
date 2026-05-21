namespace backend.Contracts.Punetor;

public sealed record CreatePunetorRequest(
    string Emri,
    string Mbiemri,
    string Pozita,
    string? Telefoni,
    string Email,
    string Password,
    DateTime? DataPunesimit,
    decimal Paga);
