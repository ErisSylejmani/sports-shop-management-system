namespace backend.Data;

/// <summary>Lidhje Ofertë–Produkt (Oferte_Produkt, op_id).</summary>
public class OferteProdukt
{
    public Guid OferteProduktId { get; set; }

    public Guid OfertaId { get; set; }

    public Guid ProduktId { get; set; }

    public Oferta Oferta { get; set; } = null!;

    public Produkt Produkt { get; set; } = null!;
}
