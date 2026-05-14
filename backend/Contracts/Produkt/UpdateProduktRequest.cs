namespace backend.Contracts.Produkt;

public sealed record UpdateProduktRequest(
    string Emri,
    string? Pershkrimi,
    Guid KategoriId,
    string Marka,
    decimal CmimiBlerjes,
    decimal CmimiShitjes,
    int SasiaStok,
    string? Madhesia,
    string? Ngjyra);
