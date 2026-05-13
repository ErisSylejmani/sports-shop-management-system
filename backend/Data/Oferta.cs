namespace backend.Data;

/// <summary>Ofertë zbritjeje (Ofertat).</summary>
public class Oferta
{
    public Guid OfertaId { get; set; }

    public string Emri { get; set; } = string.Empty;

    public string? Pershkrimi { get; set; }

    public decimal PerqindjaZbritjes { get; set; }

    public DateTime DataFillimit { get; set; }

    public DateTime DataPerfundimit { get; set; }

    public string Statusi { get; set; } = string.Empty;

    public ICollection<OferteProdukt> OferteProdukte { get; set; } = new List<OferteProdukt>();
}
