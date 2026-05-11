namespace backend.Data;

/// <summary>Rreshta në një shitje (Detajet_Shitjes).</summary>
public class DetajShitje
{
    public Guid DetajShitjeId { get; set; }

    public Guid ShitjeId { get; set; }

    public Guid ProduktId { get; set; }

    public int Sasia { get; set; }

    public decimal CmimiNjesi { get; set; }

    public decimal CmimiTotal { get; set; }

    public Shitje Shitje { get; set; } = null!;

    public Produkt Produkt { get; set; } = null!;
}
