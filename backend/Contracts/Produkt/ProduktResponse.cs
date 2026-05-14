namespace backend.Contracts.Produkt;

public sealed record ProduktResponse(
    Guid ProduktId,
    string Emri,
    string? Pershkrimi,
    Guid KategoriId,
    string KategoriEmri,
    string Marka,
    decimal CmimiBlerjes,
    decimal CmimiShitjes,
    int SasiaStok,
    string? Madhesia,
    string? Ngjyra);
