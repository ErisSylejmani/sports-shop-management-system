namespace backend.Contracts.Produkt;

public sealed record CreateProduktRequest(
    string Emri,
    string? Pershkrimi,
    Guid KategoriId,
    string Marka,
    decimal CmimiBlerjes,
    decimal CmimiShitjes,
    int SasiaStok,
    string? Madhesia,
    string? Ngjyra);
