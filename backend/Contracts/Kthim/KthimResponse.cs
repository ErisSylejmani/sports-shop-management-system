namespace backend.Contracts.Kthim;

public sealed record KthimResponse(
    Guid KthimId,
    Guid ShitjeId,
    Guid ProduktId,
    string ProduktEmri,
    DateTime DataShitjes,
    int Sasia,
    string Arsyeja,
    DateTime DataKthimit,
    string Statusi);
