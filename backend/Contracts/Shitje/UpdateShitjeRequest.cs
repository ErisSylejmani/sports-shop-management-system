namespace backend.Contracts.Shitje;

public sealed record UpdateShitjeRequest(
    Guid KlientId,
    Guid PunetorId,
    DateTime? DataShitjes,
    decimal Zbritja,
    string MetodaPageses,
    IReadOnlyList<KonfirmoShitjeLineRequest> Detajet);
