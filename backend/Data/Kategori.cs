namespace backend.Data;

public class Kategori
{
    public Guid KategoriId { get; set; }

    public string Emri { get; set; } = string.Empty;

    public string? Pershkrimi { get; set; }

    /// <summary>Hierarki opsionale: null = kategori rrënjë.</summary>
    public Guid? KategoriaPrindId { get; set; }

    public Kategori? KategoriaPrind { get; set; }

    public ICollection<Kategori> NenKategorite { get; set; } = new List<Kategori>();

    public ICollection<Produkt> Produktet { get; set; } = new List<Produkt>();
}
