using GreyPileApi.Data;
using GreyPileApi.GraphQL.Types;
using GreyPileApi.Services;
using Microsoft.EntityFrameworkCore;

namespace GreyPileApi.GraphQL;

public class Mutation
{
    public async Task<Faction> CreateFaction(CreateFactionInput input, GreyPileDbContext db)
    {
        var now = DateTime.UtcNow;
        var faction = new Faction
        {
            Name = input.Name,
            Blurb = input.Blurb,
            Accent = input.Accent,
            Tint = input.Tint,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.Factions.Add(faction);
        await db.SaveChangesAsync();
        return faction;
    }

    public async Task<Faction?> UpdateFaction(UpdateFactionInput input, GreyPileDbContext db)
    {
        var faction = await db.Factions.FindAsync(input.Id);
        if (faction is null) return null;

        if (input.Name is not null) faction.Name = input.Name;
        if (input.Blurb is not null) faction.Blurb = input.Blurb;
        if (input.Accent is not null) faction.Accent = input.Accent;
        if (input.Tint is not null) faction.Tint = input.Tint;
        faction.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return faction;
    }

    public async Task<bool> DeleteFaction(long id, GreyPileDbContext db)
    {
        var faction = await db.Factions.FindAsync(id);
        if (faction is null) return false;
        db.Factions.Remove(faction);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<Unit> CreateUnit(CreateUnitInput input, GreyPileDbContext db)
    {
        var now = DateTime.UtcNow;
        var unit = new Unit
        {
            FactionId = input.FactionId,
            Name = input.Name,
            PhotoUrl = input.PhotoUrl,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.Units.Add(unit);
        await db.SaveChangesAsync();
        return unit;
    }

    public async Task<Unit> CreateUnitWithModels(CreateUnitWithModelsInput input, GreyPileDbContext db)
    {
        var now = DateTime.UtcNow;

        var faction = await db.Factions.FirstOrDefaultAsync(f =>
            f.UserId == 1 && f.Name.ToLower() == input.FactionName.ToLower());

        if (faction is null)
        {
            faction = new Faction { Name = input.FactionName, CreatedAt = now, UpdatedAt = now };
            db.Factions.Add(faction);
            await db.SaveChangesAsync();
        }

        var unit = new Unit { FactionId = faction.Id, Name = input.UnitName, CreatedAt = now, UpdatedAt = now };
        db.Units.Add(unit);
        await db.SaveChangesAsync();

        var models = CreateModels(unit.Id, input.Count, input.Stage, now);
        db.Models.AddRange(models);
        await db.SaveChangesAsync();

        db.JournalEntries.AddRange(models.Select(m => NewJournalEntry(m.Id, null, input.Stage, now)));
        await db.SaveChangesAsync();

        // Auto-assign recipe: look for same-named unit in the same faction that
        // already has models with a recipe assigned.
        var autoRecipeId = await db.Models
            .Where(m => m.Unit.FactionId == faction.Id
                     && m.Unit.Name.ToLower() == input.UnitName.ToLower()
                     && m.Unit.Id != unit.Id
                     && m.RecipeId != null)
            .Select(m => m.RecipeId)
            .FirstOrDefaultAsync();

        // Fall back to a faction-level recipe if no unit match was found
        if (autoRecipeId is null)
        {
            autoRecipeId = await db.Recipes
                .Where(r => r.FactionId == faction.Id)
                .Select(r => (long?)r.Id)
                .FirstOrDefaultAsync();
        }

        if (autoRecipeId.HasValue)
        {
            foreach (var m in models) m.RecipeId = autoRecipeId;
            await db.SaveChangesAsync();
        }

        // Explicitly load the models collection so the GraphQL response includes them
        await db.Entry(unit).Collection(u => u.Models).LoadAsync();

        return unit;
    }

    public async Task<Unit?> UpdateUnit(UpdateUnitInput input, GreyPileDbContext db)
    {
        var unit = await db.Units.FindAsync(input.Id);
        if (unit is null) return null;

        if (input.Name is not null) unit.Name = input.Name;
        if (input.PhotoUrl is not null) unit.PhotoUrl = input.PhotoUrl;
        unit.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return unit;
    }

    public async Task<bool> DeleteUnit(long id, GreyPileDbContext db)
    {
        var unit = await db.Units.FindAsync(id);
        if (unit is null) return false;
        db.Units.Remove(unit);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<AddModelsResult> AddModels(AddModelsInput input, GreyPileDbContext db)
    {
        var unit = await db.Units.FindAsync(input.UnitId)
            ?? throw new GraphQLException($"Unit {input.UnitId} not found.");

        var now = DateTime.UtcNow;
        var models = CreateModels(input.UnitId, input.Count, input.Stage, now);

        db.Models.AddRange(models);
        await db.SaveChangesAsync();

        db.JournalEntries.AddRange(models.Select(m => NewJournalEntry(m.Id, null, input.Stage, now)));
        await db.SaveChangesAsync();

        return new AddModelsResult(unit.Id, unit.Name, input.Count);
    }

    public async Task<Model?> AdvanceStage(long modelId, GreyPileDbContext db)
    {
        var model = await db.Models.FindAsync(modelId);
        if (model is null) return null;

        var from = model.Stage;
        var to = StageHelper.Next(from);
        if (from == to) return model;

        var now = DateTime.UtcNow;
        model.Stage = to;
        model.UpdatedAt = now;

        db.JournalEntries.Add(NewJournalEntry(model.Id, from, to, now));
        await db.SaveChangesAsync();
        return model;
    }

    public async Task<Model?> SetStage(long modelId, Stage stage, GreyPileDbContext db)
    {
        var model = await db.Models.FindAsync(modelId);
        if (model is null) return null;

        var now = DateTime.UtcNow;
        var from = model.Stage;
        model.Stage = stage;
        model.UpdatedAt = now;

        db.JournalEntries.Add(NewJournalEntry(model.Id, from, stage, now));
        await db.SaveChangesAsync();
        return model;
    }

    public async Task<Model?> UpdateModelNotes(long modelId, string? notes, GreyPileDbContext db)
    {
        var model = await db.Models.FindAsync(modelId);
        if (model is null) return null;

        model.Notes = notes;
        model.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return model;
    }

    public async Task<Model?> AssignRecipe(long modelId, long? recipeId, GreyPileDbContext db)
    {
        var model = await db.Models.FindAsync(modelId);
        if (model is null) return null;

        model.RecipeId = recipeId;
        model.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return model;
    }

    public async Task<bool> DeleteModel(long id, GreyPileDbContext db)
    {
        var model = await db.Models.FindAsync(id);
        if (model is null) return false;
        db.Models.Remove(model);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<Paint> CreatePaint(CreatePaintInput input, GreyPileDbContext db)
    {
        var now = DateTime.UtcNow;
        var paint = new Paint
        {
            Name = input.Name,
            Hex = input.Hex,
            Type = input.Type,
            IsFavourite = input.IsFavourite,
            PartnerId = input.PartnerId,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.Paints.Add(paint);
        await db.SaveChangesAsync();
        return paint;
    }

    public async Task<Paint?> UpdatePaint(UpdatePaintInput input, GreyPileDbContext db)
    {
        var paint = await db.Paints.FindAsync(input.Id);
        if (paint is null) return null;

        if (input.Name is not null) paint.Name = input.Name;
        if (input.Hex is not null) paint.Hex = input.Hex;
        if (input.Type is not null) paint.Type = input.Type.Value;
        if (input.IsFavourite is not null) paint.IsFavourite = input.IsFavourite.Value;
        if (input.PartnerId is not null) paint.PartnerId = input.PartnerId;
        paint.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return paint;
    }

    public async Task<bool> DeletePaint(long id, GreyPileDbContext db)
    {
        var paint = await db.Paints.FindAsync(id);
        if (paint is null) return false;
        db.Paints.Remove(paint);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<Recipe> CreateRecipe(CreateRecipeInput input, GreyPileDbContext db)
    {
        var now = DateTime.UtcNow;
        var recipe = new Recipe
        {
            Name      = input.Name,
            Note      = input.Note,
            FactionId = input.FactionId,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.Recipes.Add(recipe);
        await db.SaveChangesAsync();
        return recipe;
    }

    public async Task<Recipe?> UpdateRecipe(UpdateRecipeInput input, GreyPileDbContext db)
    {
        var recipe = await db.Recipes.FindAsync(input.Id);
        if (recipe is null) return null;

        if (input.Name      is not null) recipe.Name      = input.Name;
        if (input.Note      is not null) recipe.Note      = input.Note;
        if (input.FactionId is not null) recipe.FactionId = input.FactionId == 0 ? null : input.FactionId;
        recipe.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return recipe;
    }

    public async Task<bool> DeleteRecipe(long id, GreyPileDbContext db)
    {
        var recipe = await db.Recipes.FindAsync(id);
        if (recipe is null) return false;
        db.Recipes.Remove(recipe);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<RecipePart> AddRecipePart(AddRecipePartInput input, GreyPileDbContext db)
    {
        var now = DateTime.UtcNow;
        var part = new RecipePart
        {
            RecipeId = input.RecipeId,
            PaintId = input.PaintId,
            SortOrder = input.SortOrder,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.RecipeParts.Add(part);
        await db.SaveChangesAsync();
        return part;
    }

    public async Task<RecipePart?> UpdateRecipePartOrder(long id, int sortOrder, GreyPileDbContext db)
    {
        var part = await db.RecipeParts.FindAsync(id);
        if (part is null) return null;

        part.SortOrder = sortOrder;
        part.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return part;
    }

    public async Task<bool> RemoveRecipePart(long id, GreyPileDbContext db)
    {
        var part = await db.RecipeParts.FindAsync(id);
        if (part is null) return false;
        db.RecipeParts.Remove(part);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<Event> CreateEvent(CreateEventInput input, GreyPileDbContext db)
    {
        var now = DateTime.UtcNow;
        var ev = new Event
        {
            Name         = input.Name,
            ShortName    = input.ShortName,
            Venue        = input.Venue,
            EventDate    = input.EventDate,
            Scope        = input.Scope,
            ModelsNeeded = input.ModelsNeeded,
            Color        = input.Color,
            CreatedAt    = now,
            UpdatedAt    = now
        };
        db.Events.Add(ev);
        await db.SaveChangesAsync();

        if (input.UnitIds is { Length: > 0 })
        {
            db.EventUnits.AddRange(input.UnitIds.Select(uid => new EventUnit
            {
                EventId = ev.Id,
                UnitId  = uid,
            }));
            await db.SaveChangesAsync();
        }

        return ev;
    }

    public async Task<Event?> UpdateEvent(UpdateEventInput input, GreyPileDbContext db)
    {
        var ev = await db.Events.FindAsync(input.Id);
        if (ev is null) return null;

        if (input.Name is not null) ev.Name = input.Name;
        if (input.ShortName is not null) ev.ShortName = input.ShortName;
        if (input.Venue is not null) ev.Venue = input.Venue;
        if (input.EventDate is not null) ev.EventDate = input.EventDate.Value;
        if (input.Scope is not null) ev.Scope = input.Scope;
        if (input.ModelsNeeded is not null) ev.ModelsNeeded = input.ModelsNeeded.Value;
        if (input.Color is not null) ev.Color = input.Color;
        ev.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return ev;
    }

    public async Task<bool> DeleteEvent(long id, GreyPileDbContext db)
    {
        var ev = await db.Events.FindAsync(id);
        if (ev is null) return false;
        db.Events.Remove(ev);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<EventUnit?> AddEventUnit(long eventId, long unitId, GreyPileDbContext db)
    {
        var existing = await db.EventUnits
            .FirstOrDefaultAsync(eu => eu.EventId == eventId && eu.UnitId == unitId);
        if (existing is not null) return existing;

        var eu = new EventUnit { EventId = eventId, UnitId = unitId };
        db.EventUnits.Add(eu);
        await db.SaveChangesAsync();
        return eu;
    }

    public async Task<bool> RemoveEventUnit(long eventId, long unitId, GreyPileDbContext db)
    {
        var eu = await db.EventUnits
            .FirstOrDefaultAsync(eu => eu.EventId == eventId && eu.UnitId == unitId);
        if (eu is null) return false;
        db.EventUnits.Remove(eu);
        await db.SaveChangesAsync();
        return true;
    }

    private static List<Model> CreateModels(long unitId, int count, Stage stage, DateTime now) =>
        Enumerable.Range(0, count)
            .Select(_ => new Model { UnitId = unitId, Stage = stage, CreatedAt = now, UpdatedAt = now })
            .ToList();

    private static JournalEntry NewJournalEntry(long modelId, Stage? fromStage, Stage toStage, DateTime now) =>
        new() { ModelId = modelId, FromStage = fromStage, ToStage = toStage, AdvancedAt = now, CreatedAt = now, UpdatedAt = now };
}
