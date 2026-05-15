namespace backend.Contracts.PorosiFurnitori;

public sealed record PorosiFurnitorDetajLineRequest(
    Guid ProduktId,
    int Sasia,
    decimal? CmimiNjesi);
