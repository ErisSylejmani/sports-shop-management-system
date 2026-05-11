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

    public DbSet<PorosiFurnitori> PorositFurnitoreve => Set<PorosiFurnitori>();

    public DbSet<DetajPorosieFurnitori> DetajetPorosiveFurnitor => Set<DetajPorosieFurnitori>();

    public DbSet<Klient> Klientet => Set<Klient>();

    public DbSet<Punetor> Punetoret => Set<Punetor>();

    public DbSet<Shitje> Shitjet => Set<Shitje>();

    public DbSet<DetajShitje> DetajetShitje => Set<DetajShitje>();

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

        builder.Entity<PorosiFurnitori>(entity =>
        {
            entity.ToTable("PorositFurnitoreve");
            entity.HasKey(e => e.PorosiId);

            entity.Property(e => e.ShumaTotale).HasPrecision(18, 2);
            entity.Property(e => e.Statusi).HasMaxLength(80).IsRequired();

            entity
                .HasOne(e => e.Furnitor)
                .WithMany(f => f.Porosite)
                .HasForeignKey(e => e.FurnitorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.FurnitorId);
            entity.HasIndex(e => e.DataPorosise);
        });

        builder.Entity<DetajPorosieFurnitori>(entity =>
        {
            entity.ToTable("DetajetPorosiseFurnitorit");
            entity.HasKey(e => e.DetajPorosiId);

            entity.Property(e => e.CmimiNjesi).HasPrecision(18, 2);
            entity.Property(e => e.CmimiTotal).HasPrecision(18, 2);

            entity
                .HasOne(e => e.Porosi)
                .WithMany(p => p.Detajet)
                .HasForeignKey(e => e.PorosiId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(e => e.Produkt)
                .WithMany(pr => pr.DetajetPorosiveFurnitor)
                .HasForeignKey(e => e.ProduktId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.PorosiId);
            entity.HasIndex(e => e.ProduktId);
        });

        builder.Entity<Klient>(entity =>
        {
            entity.ToTable("Klientet");
            entity.HasKey(e => e.KlientId);

            entity.Property(e => e.Emri).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Mbiemri).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Telefoni).HasMaxLength(30);
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.Adresa).HasMaxLength(500);

            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.DataRegjistrimit);
        });

        builder.Entity<Punetor>(entity =>
        {
            entity.ToTable("Punetoret");
            entity.HasKey(e => e.PunetorId);

            entity.Property(e => e.Emri).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Mbiemri).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Pozita).HasMaxLength(120).IsRequired();
            entity.Property(e => e.Telefoni).HasMaxLength(30);
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.Paga).HasPrecision(18, 2);

            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.DataPunesimit);
        });

        builder.Entity<Shitje>(entity =>
        {
            entity.ToTable("Shitjet");
            entity.HasKey(e => e.ShitjeId);

            entity.Property(e => e.ShumaTotale).HasPrecision(18, 2);
            entity.Property(e => e.Zbritja).HasPrecision(18, 2);
            entity.Property(e => e.MetodaPageses).HasMaxLength(80).IsRequired();

            entity
                .HasOne(e => e.Klient)
                .WithMany(k => k.Shitjet)
                .HasForeignKey(e => e.KlientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(e => e.Punetor)
                .WithMany(p => p.Shitjet)
                .HasForeignKey(e => e.PunetorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.KlientId);
            entity.HasIndex(e => e.PunetorId);
            entity.HasIndex(e => e.DataShitjes);
        });

        builder.Entity<DetajShitje>(entity =>
        {
            entity.ToTable("DetajetShitjes");
            entity.HasKey(e => e.DetajShitjeId);

            entity.Property(e => e.CmimiNjesi).HasPrecision(18, 2);
            entity.Property(e => e.CmimiTotal).HasPrecision(18, 2);

            entity
                .HasOne(e => e.Shitje)
                .WithMany(s => s.Detajet)
                .HasForeignKey(e => e.ShitjeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(e => e.Produkt)
                .WithMany(p => p.DetajetShitje)
                .HasForeignKey(e => e.ProduktId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.ShitjeId);
            entity.HasIndex(e => e.ProduktId);
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
