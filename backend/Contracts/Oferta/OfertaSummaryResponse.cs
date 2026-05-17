namespace backend.Contracts.Oferta;

public sealed record OfertaSummaryResponse(
    Guid OfertaId,
    string Emri,
    decimal PerqindjaZbritjes,
    DateTime DataFillimit,
    DateTime DataPerfundimit,
    string Statusi,
    int NumriProdukteve);
