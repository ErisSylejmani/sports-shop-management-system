namespace backend.Data;

/// <summary>Porosi nga furnitor (Porositë_Furnitoreve).</summary>
public class PorosiFurnitori
{
    public Guid PorosiId { get; set; }

    public Guid FurnitorId { get; set; }

    public DateTime DataPorosise { get; set; }

    public DateTime? DataPritshme { get; set; }

    public decimal ShumaTotale { get; set; }

    public string Statusi { get; set; } = string.Empty;

    public Furnitor Furnitor { get; set; } = null!;

    public ICollection<DetajPorosieFurnitori> Detajet { get; set; } = new List<DetajPorosieFurnitori>();
}
