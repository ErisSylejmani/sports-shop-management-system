namespace backend.Contracts.Kthim;

public sealed record UpdateKthimRequest(
    int Sasia,
    string Arsyeja,
    DateTime DataKthimit,
    string Statusi);
