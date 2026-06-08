using GreyPileApi.Data;

namespace GreyPileApi.GraphQL.Types;

// Faction
public record CreateFactionInput(string Name, string? Blurb, string? Accent, string? Tint);
public record UpdateFactionInput(long Id, string? Name, string? Blurb, string? Accent, string? Tint);

// Unit
public record CreateUnitInput(long FactionId, string Name, string? PhotoUrl);
public record CreateUnitWithModelsInput(string FactionName, string UnitName, int Count, Stage Stage);
public record UpdateUnitInput(long Id, string? Name, string? PhotoUrl);

// Model
public record AddModelsInput(long UnitId, int Count, Stage Stage);

// Paint
public record CreatePaintInput(string Name, string Hex, PaintType Type, bool IsFavourite = false, long? PartnerId = null);
public record UpdatePaintInput(long Id, string? Name, string? Hex, PaintType? Type, bool? IsFavourite, long? PartnerId);

// Recipe
public record CreateRecipeInput(string Name, string? Note, long? FactionId = null);
public record UpdateRecipeInput(long Id, string? Name, string? Note, long? FactionId = null);

// RecipePart
public record AddRecipePartInput(long RecipeId, long PaintId, int SortOrder);

// Event
public record CreateEventInput(string Name, string ShortName, string? Venue, DateOnly EventDate, string Scope, int ModelsNeeded, string Color, long[]? UnitIds = null);
public record UpdateEventInput(long Id, string? Name, string? ShortName, string? Venue, DateOnly? EventDate, string? Scope, int? ModelsNeeded, string? Color);
