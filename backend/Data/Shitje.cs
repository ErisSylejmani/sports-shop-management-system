namespace backend.Data;

/// <summary>Shitje (Shitjet).</summary>
public class Shitje
{
    public Guid ShitjeId { get; set; }

    public Guid KlientId { get; set; }

    public Guid PunetorId { get; set; }

    public DateTime DataShitjes { get; set; }

    public decimal ShumaTotale { get; set; }

    public decimal Zbritja { get; set; }

    public string MetodaPageses { get; set; } = string.Empty;

    public Klient Klient { get; set; } = null!;

    public Punetor Punetor { get; set; } = null!;

    public ICollection<DetajShitje> Detajet { get; set; } = new List<DetajShitje>();
}
