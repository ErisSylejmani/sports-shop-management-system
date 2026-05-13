namespace backend.Data;

/// <summary>Kthim malli (Kthimet).</summary>
public class Kthim
{
    public Guid KthimId { get; set; }

    public Guid ShitjeId { get; set; }

    public Guid ProduktId { get; set; }

    public int Sasia { get; set; }

    public string Arsyeja { get; set; } = string.Empty;

    public DateTime DataKthimit { get; set; }

    public string Statusi { get; set; } = string.Empty;

    public Shitje Shitje { get; set; } = null!;

    public Produkt Produkt { get; set; } = null!;
}
