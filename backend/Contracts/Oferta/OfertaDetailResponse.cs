namespace backend.Contracts.Oferta;

public sealed record OfertaDetailResponse(
    Guid OfertaId,
    string Emri,
    string? Pershkrimi,
    decimal PerqindjaZbritjes,
    DateTime DataFillimit,
    DateTime DataPerfundimit,
    string Statusi,
    IReadOnlyList<OferteProduktResponse> Produktet);
