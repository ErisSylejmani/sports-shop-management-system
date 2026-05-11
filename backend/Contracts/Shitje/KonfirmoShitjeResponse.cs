namespace backend.Contracts.Shitje;

public sealed record KonfirmoShitjeDetajResponse(
    Guid DetajShitjeId,
    Guid ProduktId,
    string ProduktEmri,
    int Sasia,
    decimal CmimiNjesi,
    decimal CmimiTotal);

public sealed record KonfirmoShitjeResponse(
    Guid ShitjeId,
    decimal ShumaParaZbritjes,
    decimal Zbritja,
    decimal ShumaTotale,
    IReadOnlyList<KonfirmoShitjeDetajResponse> Detajet);
