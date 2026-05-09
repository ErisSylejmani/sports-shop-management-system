namespace backend.Data;

/// <summary>Punëtor në dyqan (Punetoret).</summary>
public class Punetor
{
    public Guid PunetorId { get; set; }

    public string Emri { get; set; } = string.Empty;

    public string Mbiemri { get; set; } = string.Empty;

    public string Pozita { get; set; } = string.Empty;

    public string? Telefoni { get; set; }

    public string? Email { get; set; }

    public DateTime DataPunesimit { get; set; }

    public decimal Paga { get; set; }
}
