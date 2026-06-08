using GreyPileApi.Data;

namespace GreyPileApi.GraphQL;

public class Query
{
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Faction> GetFactions(GreyPileDbContext db)
        => db.Factions;

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Unit> GetUnits(GreyPileDbContext db)
        => db.Units;

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Model> GetModels(GreyPileDbContext db)
        => db.Models;

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Recipe> GetRecipes(GreyPileDbContext db)
        => db.Recipes;

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Paint> GetPaints(GreyPileDbContext db)
        => db.Paints;

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<RecipePart> GetRecipeParts(GreyPileDbContext db)
        => db.RecipeParts;

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Event> GetEvents(GreyPileDbContext db)
        => db.Events;

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<JournalEntry> GetJournalEntries(GreyPileDbContext db)
        => db.JournalEntries;
}
