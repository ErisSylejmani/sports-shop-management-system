namespace backend.Contracts.Oferta;

public sealed record CreateOfertaRequest(
    string Emri,
    string? Pershkrimi,
    decimal PerqindjaZbritjes,
    DateTime DataFillimit,
    DateTime DataPerfundimit,
    string Statusi,
    IReadOnlyList<Guid> ProduktIds);
