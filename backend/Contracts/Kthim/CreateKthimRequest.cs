namespace backend.Contracts.Kthim;

public sealed record CreateKthimRequest(
    Guid ShitjeId,
    Guid ProduktId,
    int Sasia,
    string Arsyeja,
    DateTime? DataKthimit,
    string Statusi);
