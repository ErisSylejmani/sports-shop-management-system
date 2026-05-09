namespace backend.Data;

/// <summary>Klient blerës (Klientet).</summary>
public class Klient
{
    public Guid KlientId { get; set; }

    public string Emri { get; set; } = string.Empty;

    public string Mbiemri { get; set; } = string.Empty;

    public string? Telefoni { get; set; }

    public string? Email { get; set; }

    public string? Adresa { get; set; }

    public DateTime DataRegjistrimit { get; set; }

    public int PiketBesnikerise { get; set; }
}
