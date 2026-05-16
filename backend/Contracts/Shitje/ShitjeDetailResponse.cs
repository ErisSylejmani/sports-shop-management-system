namespace backend.Contracts.Shitje;

public sealed record ShitjeDetailResponse(
    Guid ShitjeId,
    Guid KlientId,
    string KlientEmri,
    Guid PunetorId,
    string PunetorEmri,
    DateTime DataShitjes,
    decimal ShumaParaZbritjes,
    decimal Zbritja,
    decimal ShumaTotale,
    string MetodaPageses,
    IReadOnlyList<KonfirmoShitjeDetajResponse> Detajet);
