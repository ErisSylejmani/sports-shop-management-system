namespace backend.Contracts.Shitje;

public sealed record ShitjeSummaryResponse(
    Guid ShitjeId,
    Guid KlientId,
    string KlientEmri,
    Guid PunetorId,
    string PunetorEmri,
    DateTime DataShitjes,
    decimal ShumaTotale,
    decimal Zbritja,
    string MetodaPageses);
