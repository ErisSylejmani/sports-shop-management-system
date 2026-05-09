namespace backend.Data;

/// <summary>Rresht në porosi furnitori (Detajet_Porosise_Furnitorit).</summary>
public class DetajPorosieFurnitori
{
    public Guid DetajPorosiId { get; set; }

    public Guid PorosiId { get; set; }

    public Guid ProduktId { get; set; }

    public int Sasia { get; set; }

    public decimal CmimiNjesi { get; set; }

    public decimal CmimiTotal { get; set; }

    public PorosiFurnitori Porosi { get; set; } = null!;

    public Produkt Produkt { get; set; } = null!;
}
