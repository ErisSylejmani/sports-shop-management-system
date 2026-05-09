using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<Kategori> Kategorite => Set<Kategori>();

    public DbSet<Produkt> Produktet => Set<Produkt>();

    public DbSet<Furnitor> Furnitoret => Set<Furnitor>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Kategori>(entity =>
        {
            entity.ToTable("Kategorite");
            entity.HasKey(e => e.KategoriId);

            entity.Property(e => e.Emri).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Pershkrimi).HasMaxLength(2000);

            entity
                .HasOne(e => e.KategoriaPrind)
                .WithMany(e => e.NenKategorite)
                .HasForeignKey(e => e.KategoriaPrindId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.KategoriaPrindId);
            entity.HasIndex(e => e.Emri);
        });

        builder.Entity<Produkt>(entity =>
        {
            entity.ToTable("Produktet");
            entity.HasKey(e => e.ProduktId);

            entity.Property(e => e.Emri).HasMaxLength(300).IsRequired();
            entity.Property(e => e.Pershkrimi).HasMaxLength(4000);
            entity.Property(e => e.Marka).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Madhesia).HasMaxLength(50);
            entity.Property(e => e.Ngjyra).HasMaxLength(80);
            entity.Property(e => e.CmimiBlerjes).HasPrecision(18, 2);
            entity.Property(e => e.CmimiShitjes).HasPrecision(18, 2);

            entity
                .HasOne(e => e.Kategori)
                .WithMany(k => k.Produktet)
                .HasForeignKey(e => e.KategoriId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.KategoriId);
            entity.HasIndex(e => e.Emri);
        });

        builder.Entity<Furnitor>(entity =>
        {
            entity.ToTable("Furnitoret");
            entity.HasKey(e => e.FurnitorId);

            entity.Property(e => e.Emri).HasMaxLength(300).IsRequired();
            entity.Property(e => e.PersoniKontaktit).HasMaxLength(200);
            entity.Property(e => e.Telefoni).HasMaxLength(30);
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.Adresa).HasMaxLength(500);
            entity.Property(e => e.Qyteti).HasMaxLength(120);
            entity.Property(e => e.Shteti).HasMaxLength(120);

            entity.HasIndex(e => e.Emri);
        });

        builder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Token);
            entity.Property(e => e.Token).HasMaxLength(500);
            entity
                .HasOne(e => e.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
