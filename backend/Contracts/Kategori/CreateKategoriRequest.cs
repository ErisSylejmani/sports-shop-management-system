namespace backend.Contracts.Kategori;

public sealed record CreateKategoriRequest(
    string Emri,
    string? Pershkrimi,
    Guid? KategoriaPrindId);
