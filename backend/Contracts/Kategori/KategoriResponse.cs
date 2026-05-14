namespace backend.Contracts.Kategori;

public sealed record KategoriResponse(
    Guid KategoriId,
    string Emri,
    string? Pershkrimi,
    Guid? KategoriaPrindId);
