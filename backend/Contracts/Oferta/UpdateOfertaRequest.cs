namespace backend.Contracts.Oferta;

public sealed record UpdateOfertaRequest(
    string Emri,
    string? Pershkrimi,
    decimal PerqindjaZbritjes,
    DateTime DataFillimit,
    DateTime DataPerfundimit,
    string Statusi,
    IReadOnlyList<Guid> ProduktIds);
