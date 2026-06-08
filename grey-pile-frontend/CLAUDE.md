### Reminder on Coding Standards
    2. determine if there is any duplication in the code that could be made into a component
    3. ask the user to name the new component or if there is a component that you can fit it into
    4. determine the least amount of unit tests needed in order to test the new feature, adding to current unit tests only if there isnt full coverage given the current unit tests

# Grey Pile — Coding Guide

## Overview

Two apps, one domain: tracking Warhammer miniature painting progress.

- **grey-pile-frontend** — React 19 + TypeScript + Redux Toolkit SPA
- **grey-pile-api** — ASP.NET Core 10 + HotChocolate GraphQL + EF Core + PostgreSQL

---

## Project Structure

### Frontend (`grey-pile-frontend/src/`)

```
/components      # Reusable presentational UI (CardParts.tsx, Card.ts, Header.ts)
/pages           # Full-page views and modals (Roster.tsx, Paints.tsx, ModelDetail.tsx, UnitModal.tsx, journal/)
/services        # GraphQL mutations, dispatched as AppThunk (rosterService.ts, paintService.ts, eventService.ts)
/slices          # Redux state (factionSlice.ts, unitSlice.ts, modelSlice.ts, paintSlice.ts, recipeSlice.ts, eventSlice.ts, statsSlice.ts)
/types           # All shared TypeScript interfaces and union types (index.ts)
/utils           # Pure helpers, no side effects (stageUtils.ts)
store.tsx        # Redux store + typed hooks (useAppDispatch, useAppSelector)
App.tsx          # Routes
```

### Backend (`grey-pile-api/`)

```
/Data            # EF Core entities + GreyPileDbContext (Faction.cs, Unit.cs, Model.cs, Paint.cs, ...)
/GraphQL         # HotChocolate Query.cs and Mutation.cs
/GraphQL/Types   # Input records and result types (Inputs.cs, Results.cs)
/Controllers     # REST endpoints (FactionsController, ModelsController, UnitsController, RosterController)
/Services        # Business logic (StageHelper.cs)
/Migrations      # EF Core migrations
Program.cs       # App startup and service registration
```

---

## Frontend

### TypeScript Types

All shared types live in `types/index.ts`. Never define them inline in components or slices.

**Enums are string union types**, not TypeScript `enum`, to stay in sync with GraphQL lowercase values:

```typescript
export type Stage = 'unbuilt' | 'built' | 'primed' | 'base' | 'painted';
export type PaintType = 'base' | 'layer' | 'wash' | 'metallic' | 'texture';
```

**Entities reflect GraphQL shapes** with optional fields marked `?`:

```typescript
export interface Faction {
  id: number;
  name: string;
  blurb?: string;
  accent?: string;  // hex color e.g. #caa15a
  tint?: string;
  units: Unit[];
}
```

**List vs detail shapes** are kept separate when the data differs:
- `Unit` — lightweight, for roster display (stageCounts, completionPct, modelCount)
- `UnitDetail` — full data including models array and progress breakdown

**Raw API shapes** (`RawModel`, `RawUnit`, `RawFaction`) are used for API responses before normalization (e.g. stage casing), then transformed before storing in Redux.

---

### Redux Slices

Each slice follows the same structure. The pattern for a new slice:

```typescript
interface SliceState {
  items: T[];
  loading: boolean;
  error: string | null;
}

const initialState: SliceState = { items: [], loading: false, error: null };

// Async thunk for reads — skip if already loaded
export const fetchItems = createAsyncThunk(
  'slice/fetch',
  async (): Promise<T[]> => { /* API call */ },
  {
    condition: (_, { getState }) => getState().slice.items.length === 0,
  }
);

const slice = createSlice({
  name: 'slice',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<T>) { state.items.push(action.payload); },
    updateItem(state, action: PayloadAction<T>) {
      const idx = state.items.findIndex(i => i.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    removeItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchItems.pending, state => { state.loading = true; state.error = null; })
      .addCase(fetchItems.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchItems.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? null; });
  },
});
```

**Slice-specific notes:**

| Slice | Special behaviour |
|---|---|
| `factionSlice` | Fetches full roster hierarchy (factions → units → models); triggers stats computation in extraReducers |
| `unitSlice` | Stores both `items[]` and `detail` (currently-open unit); `fetchUnitDetail` skips if already loaded |
| `modelSlice` | Only holds models for the currently-open unit; populated as a side-effect of `fetchUnitDetail` |
| `statsSlice` | No own fetch; listens to `fetchRoster.fulfilled` and derives aggregated stats |
| `paintSlice` | Includes `activeFilter` for UI-side filtering |
| `eventSlice` | Auto-sorts by `eventDate` on add/update |

**Cross-slice actions** (dispatched from services when deleting entities):
- `removeUnitFromFaction` — updates `faction.units` when a unit is deleted
- `removeUnitFromAllEvents` — cleans up event registrations when a unit is deleted

---

### Services

Services handle GraphQL mutations and dispatch sync Redux actions. They are `AppThunk` functions, not API utility files.

```typescript
export const createUnit = (input: CreateUnitInput): AppThunk => async (dispatch) => {
  const result = await gql<{ createUnit: Unit }>(CREATE_UNIT_MUTATION, { input });
  dispatch(addUnit(result.createUnit));
  // Update related slices if needed
};
```

Services live in `/services/`, one file per domain area. Fetch thunks (reads) live in the slice file itself. Mutations live in the service file.

---

### GraphQL Client

All queries and mutations go through the `gql()` utility in `api.ts`:

```typescript
// Returns { data } or throws on GraphQL errors
const result = await gql<{ factions: Faction[] }>(QUERY, { variables });
```

The endpoint is set via `REACT_APP_API_URL` (default: `http://localhost:5260/graphql`).

Query strings are defined as template literals, either in the slice file (for fetches) or the service file (for mutations).

---

### Components

Components in `/components/` are presentational — they accept data and callbacks as props, no Redux access.

Pages in `/pages/` own the Redux connection: `useAppSelector` for reads, `useAppDispatch` + service calls for writes.

**Typed hooks** from `store.tsx`:

```typescript
const dispatch = useAppDispatch();
const factions = useAppSelector(s => s.factions.items);
```

**Loading states** for buttons use local `useState`, not Redux loading flags:

```typescript
const [saving, setSaving] = useState(false);
// on submit: setSaving(true) → await dispatch(service()) → setSaving(false)
```

---

### Routing

| Path | Page |
|---|---|
| `/roster` | Main list view |
| `/add` | New unit form |
| `/paints` | Paint library and recipes |
| `/paints/:id/detail` | Model detail with stage stepper and recipe assignment |
| `/journal` | Event tracking and history |

Modals (`UnitModal.tsx`, `AddEventModal.tsx`) open as overlays — no route change.

---

### CSS Conventions

Theme values are CSS variables:

```css
--ink, --ink2, --ink3          /* text: lightest → darkest */
--card, --bg2, --bg3           /* backgrounds */
--accent, --accent2            /* UI accent */
--stage-{stage}-fill           /* per-stage color fills */
--stage-{stage}-ink
--stage-{stage}-tag
```

Fonts:
- `--font-serif` (Spectral) — display/headings
- `--font-hand` (Caveat) — body
- `--font-mono` (JetBrains Mono) — counts and badges

Inline `style` props are used freely for one-off layouts. Rotation utility classes (`rotate-neg-md`, `rotate-pos-sm`) create the skewed card aesthetic.

---

## Backend

### Entities

All entities follow the same base shape:

```csharp
[Table("entity_name")]
public class Entity {
  [Column("id")] public long Id { get; set; }
  [Column("user_id")] public int UserId { get; set; } = 1;
  [Column("created_at")] public DateTime CreatedAt { get; set; }
  [Column("updated_at")] public DateTime UpdatedAt { get; set; }
  [Column("name"), MaxLength(255)] public string Name { get; set; } = string.Empty;
}
```

- Table and column names are **snake_case** via `[Column]` attributes
- `UserId` defaults to `1` — single-user app, no auth
- All timestamps are `DateTime.UtcNow`
- Nullable reference types use `string?`, `long?`, etc.
- Required navigation properties that EF populates use `= null!`

**Enum storage** — stored as strings in the DB, configured in `OnModelCreating`:

```csharp
modelBuilder.Entity<Model>().Property(m => m.Stage).HasConversion<string>();
```

**GraphQL enum names** use `[GraphQLName]` so C# PascalCase maps to lowercase GraphQL values that match TypeScript union types:

```csharp
public enum Stage {
  [GraphQLName("unbuilt")] Unbuilt,
  [GraphQLName("painted")] Painted,
  // ...
}
```

---

### Relationships and Cascade Rules

Configured in `OnModelCreating`. Summary:

| Relationship | On Delete |
|---|---|
| Faction → Units | CASCADE |
| Unit → Models | CASCADE |
| Model → JournalEntries | CASCADE |
| Recipe → RecipeParts | CASCADE |
| Event → EventUnits | CASCADE |
| EventUnit → Unit | CASCADE |
| Model.RecipeId → Recipe | SET NULL |
| Recipe.FactionId → Faction | SET NULL |
| RecipePart.PaintId → Paint | RESTRICT (throws if paint is in use) |
| Paint.PartnerId → Paint (self) | SET NULL |

The `JournalEntry → Model` cascade is load-bearing: without it, deleting a unit (which cascades to models) would violate the FK constraint on journal entries.

---

### GraphQL — Query

Query methods return `IQueryable<T>` and are decorated with HotChocolate attributes:

```csharp
public class Query {
  [UseProjection]   // Client can select specific fields; translates to SQL SELECT
  [UseFiltering]    // Enables where: { field: { eq: value } }
  [UseSorting]      // Enables order: { field: ASC }
  public IQueryable<Faction> GetFactions(GreyPileDbContext db) => db.Factions;
}
```

No authentication — all queries are unscoped at the GraphQL layer. `UserId == 1` filtering happens in controllers where it's applied, and implicitly via the single-user data set.

---

### GraphQL — Mutations

Mutations are async methods on the `Mutation` class. Standard pattern:

```csharp
public async Task<Faction> CreateFaction(CreateFactionInput input, GreyPileDbContext db) {
  var now = DateTime.UtcNow;
  var faction = new Faction { Name = input.Name, Blurb = input.Blurb, CreatedAt = now, UpdatedAt = now };
  db.Factions.Add(faction);
  await db.SaveChangesAsync();
  return faction;
}
```

- Return `null` (nullable return type) to signal "not found" — GraphQL surfaces this as null
- Throw `GraphQLException` for hard errors: `?? throw new GraphQLException("Not found")`
- If the return value needs navigation properties loaded, do it explicitly before returning:
  ```csharp
  await db.Entry(unit).Collection(u => u.Models).LoadAsync();
  return unit;
  ```

**Navigation properties on GraphQL types** that would cause circular references are marked `[GraphQLIgnore]`. The frontend receives flattened shapes (e.g. `eventUnits: [{ unitId }]` rather than nested unit objects).

---

### Input and Result Types

Defined in `GraphQL/Types/Inputs.cs` and `Results.cs`.

```csharp
// Inputs use record syntax, match GraphQL camelCase automatically
public record CreateFactionInput(string Name, string? Blurb, string? Accent, string? Tint);

// Results for mutations that return computed data rather than a single entity
public record AddModelsResult(long UnitId, string UnitName, int ModelsCreated);
```

---

### REST Controllers

Controllers are thin. Standard shape:

```csharp
[ApiController]
[Route("api/resource")]
public class EntityController(GreyPileDbContext db) : ControllerBase {
  [HttpGet]    // GetAll: filter UserId == 1, order, return Ok
  [HttpGet("{id:long}")]  // GetById: FindAsync, NotFound or Ok
  [HttpPost]   // Create: set timestamps, Add, SaveChanges, CreatedAtAction
  [HttpPatch("{id:long}")] // Update: FindAsync, patch fields, SaveChanges, Ok
  [HttpDelete("{id:long}")] // Delete: FindAsync, Remove, SaveChanges, NoContent
}
```

Request bodies use records:

```csharp
public record CreateFactionRequest(string Name, string? Blurb, string? Accent, string? Tint);
```

Notable non-standard controllers:
- `RosterController.GetRoster` — joins factions/units/models and computes `stageCounts` and `completionPct` inline
- `ModelsController.AddModels` — bulk creates models and journal entries, returns a summary
- `ModelsController.AdvanceStage` — moves to next stage via `StageHelper.Next()`, writes a journal entry

---

### StageHelper

Centralises all stage logic: ordering, index lookup, next stage, completion percentage. Used by both controllers and mutations. Frontend mirrors this in `stageUtils.ts`.

If stage logic needs to change, update `StageHelper.cs` and `stageUtils.ts` together.

---

### Journal Entries

Every model stage change is written to `JournalEntries` with from/to stage and timestamp. This is the audit trail — it enables future rollback and history views. Always write a journal entry when calling `advanceStage` or `setStage`.

---

## Adding a New Feature

Follow this checklist for a new domain entity end-to-end:

1. **Entity** — add to `/Data/`, set column attributes, default `UserId = 1`, timestamps
2. **DbContext** — add `DbSet<T>`, configure relationships and cascade rules in `OnModelCreating`
3. **Migration** — `dotnet ef migrations add`, review the generated SQL
4. **GraphQL** — add query method to `Query.cs`, CRUD mutations to `Mutation.cs`, input/result records to `Types/`
5. **Types** — add TypeScript interface to `types/index.ts`
6. **Slice** — add Redux slice with fetch thunk (condition to skip re-fetch) and sync actions
7. **Service** — add mutation functions that call `gql()` and dispatch sync actions
8. **Component / Page** — connect via `useAppSelector` and `useAppDispatch`
