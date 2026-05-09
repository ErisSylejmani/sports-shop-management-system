namespace backend.Data;

public class Furnitor
{
    public Guid FurnitorId { get; set; }

    public string Emri { get; set; } = string.Empty;

    public string? PersoniKontaktit { get; set; }

    public string? Telefoni { get; set; }

    public string? Email { get; set; }

    public string? Adresa { get; set; }

    public string? Qyteti { get; set; }

    public string? Shteti { get; set; }

    public ICollection<PorosiFurnitori> Porosite { get; set; } = new List<PorosiFurnitori>();
}
