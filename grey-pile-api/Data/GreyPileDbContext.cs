using Microsoft.EntityFrameworkCore;

namespace GreyPileApi.Data;

public class GreyPileDbContext(DbContextOptions<GreyPileDbContext> options) : DbContext(options)
{
    public DbSet<Faction> Factions => Set<Faction>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<Model> Models => Set<Model>();
    public DbSet<Paint> Paints => Set<Paint>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<RecipePart> RecipeParts => Set<RecipePart>();
    public DbSet<Event>      Events       => Set<Event>();
    public DbSet<EventUnit>  EventUnits   => Set<EventUnit>();
    public DbSet<JournalEntry> JournalEntries => Set<JournalEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Model>()
            .Property(m => m.Stage)
            .HasConversion<string>();

        modelBuilder.Entity<Paint>()
            .Property(p => p.Type)
            .HasConversion<string>();

        modelBuilder.Entity<JournalEntry>()
            .Property(j => j.FromStage)
            .HasConversion<string>();

        modelBuilder.Entity<JournalEntry>()
            .Property(j => j.ToStage)
            .HasConversion<string>();

        // Self-referencing FK on Paint.Partner — no cascade to avoid cycles
        modelBuilder.Entity<Paint>()
            .HasOne(p => p.Partner)
            .WithMany()
            .HasForeignKey(p => p.PartnerId)
            .OnDelete(DeleteBehavior.SetNull);

        // Faction → Units cascade
        modelBuilder.Entity<Unit>()
            .HasOne(u => u.Faction)
            .WithMany(f => f.Units)
            .HasForeignKey(u => u.FactionId)
            .OnDelete(DeleteBehavior.Cascade);

        // Unit → Models cascade
        modelBuilder.Entity<Model>()
            .HasOne(m => m.Unit)
            .WithMany(u => u.Models)
            .HasForeignKey(m => m.UnitId)
            .OnDelete(DeleteBehavior.Cascade);

        // Model → Recipe (nullable, no cascade)
        modelBuilder.Entity<Model>()
            .HasOne(m => m.Recipe)
            .WithMany()
            .HasForeignKey(m => m.RecipeId)
            .OnDelete(DeleteBehavior.SetNull);

        // Recipe → Faction (optional, no cascade — deleting a faction leaves recipes intact)
        modelBuilder.Entity<Recipe>()
            .HasOne(r => r.Faction)
            .WithMany()
            .HasForeignKey(r => r.FactionId)
            .OnDelete(DeleteBehavior.SetNull);

        // Recipe → RecipeParts cascade
        modelBuilder.Entity<RecipePart>()
            .HasOne(rp => rp.Recipe)
            .WithMany(r => r.Parts)
            .HasForeignKey(rp => rp.RecipeId)
            .OnDelete(DeleteBehavior.Cascade);

        // RecipePart → Paint (restrict — deletePaint is blocked if used in a recipe)
        modelBuilder.Entity<RecipePart>()
            .HasOne(rp => rp.Paint)
            .WithMany()
            .HasForeignKey(rp => rp.PaintId)
            .OnDelete(DeleteBehavior.Restrict);

        // Event → EventUnits cascade; unique per (event, unit)
        modelBuilder.Entity<EventUnit>()
            .HasOne(eu => eu.Event)
            .WithMany(e => e.EventUnits)
            .HasForeignKey(eu => eu.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<EventUnit>()
            .HasOne(eu => eu.Unit)
            .WithMany()
            .HasForeignKey(eu => eu.UnitId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<EventUnit>()
            .HasIndex(eu => new { eu.EventId, eu.UnitId })
            .IsUnique();

        // JournalEntry → Model: cascade so deleting a model cleans up its history,
        // allowing deleteFaction/deleteUnit to fully cascade without FK conflicts.
        modelBuilder.Entity<JournalEntry>()
            .HasOne(j => j.Model)
            .WithMany()
            .HasForeignKey(j => j.ModelId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
