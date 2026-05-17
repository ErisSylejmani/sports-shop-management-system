namespace backend.Contracts.Oferta;

public sealed record ReplaceOferteProduktRequest(IReadOnlyList<Guid> ProduktIds);
