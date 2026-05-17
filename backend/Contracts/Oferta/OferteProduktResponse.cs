namespace backend.Contracts.Oferta;

public sealed record OferteProduktResponse(
    Guid OferteProduktId,
    Guid ProduktId,
    string ProduktEmri);
