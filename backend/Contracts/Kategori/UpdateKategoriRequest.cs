namespace backend.Contracts.Kategori;

public sealed record UpdateKategoriRequest(
    string Emri,
    string? Pershkrimi,
    Guid? KategoriaPrindId);
