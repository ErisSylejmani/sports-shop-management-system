namespace backend.Data;

public class Produkt
{
    public Guid ProduktId { get; set; }

    public string Emri { get; set; } = string.Empty;

    public string? Pershkrimi { get; set; }

    public Guid KategoriId { get; set; }

    public string Marka { get; set; } = string.Empty;

    public decimal CmimiBlerjes { get; set; }

    public decimal CmimiShitjes { get; set; }

    public int SasiaStok { get; set; }

    public string? Madhesia { get; set; }

    public string? Ngjyra { get; set; }

    public Kategori Kategori { get; set; } = null!;

    public ICollection<DetajPorosieFurnitori> DetajetPorosiveFurnitor { get; set; } =
        new List<DetajPorosieFurnitori>();

    public ICollection<DetajShitje> DetajetShitje { get; set; } = new List<DetajShitje>();

    public ICollection<Kthim> Kthimet { get; set; } = new List<Kthim>();

    public ICollection<OferteProdukt> OferteProdukte { get; set; } = new List<OferteProdukt>();
}
