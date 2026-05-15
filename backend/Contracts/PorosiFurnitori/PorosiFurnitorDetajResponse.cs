namespace backend.Contracts.PorosiFurnitori;

public sealed record PorosiFurnitorDetajResponse(
    Guid DetajPorosiId,
    Guid ProduktId,
    string ProduktEmri,
    int Sasia,
    decimal CmimiNjesi,
    decimal CmimiTotal);
