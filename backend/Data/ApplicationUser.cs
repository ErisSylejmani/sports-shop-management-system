using Microsoft.AspNetCore.Identity;

namespace backend.Data;

// Trashëgon IdentityUser<Guid>: PasswordHash, Email, PhoneNumber, EmailConfirmed, LockoutEnabled, AccessFailedCount, etj.
public class ApplicationUser : IdentityUser<Guid>
{
    public string Emri { get; set; } = string.Empty;
    public string Mbiemri { get; set; } = string.Empty;
    public DateTime DataKrijimit { get; set; } = DateTime.UtcNow;
    public bool EshteAktiv { get; set; } = true;

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
