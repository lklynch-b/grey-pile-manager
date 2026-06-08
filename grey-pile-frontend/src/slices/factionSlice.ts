import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { gql } from '../services/api';
import { Faction, Unit, Stage, Stats } from '../types';
import { computeStageCounts, computeCompletionPct, computeStats, normalizeStage } from '../utils/stageUtils';

// ─── Raw API shapes (before transformation) ───────────────────────────────────

interface RawModel   { id: number; stage: string; }  // string: API may return any case
interface RawUnit    { id: number; factionId: number; name: string; photoUrl?: string; models: RawModel[]; }
interface RawFaction { id: number; name: string; blurb?: string; accent?: string; tint?: string; units: RawUnit[]; }

const ROSTER_QUERY = `
  query FetchRoster {
    factions(order: { name: ASC }) {
      id name blurb accent tint
      units {
        id factionId name photoUrl
        models { id stage }
      }
    }
  }
`;

// ─── State ────────────────────────────────────────────────────────────────────

interface FactionState {
  items: Faction[];
  loading: boolean;
  error: string | null;
}

const initialState: FactionState = {
  items: [],
  loading: false,
  error: null,
};

// ─── Async: fetch roster ──────────────────────────────────────────────────────
// Skipped automatically if factions are already in the store.
// Returns both factions and stats so statsSlice can listen to the same action.

export const fetchRoster = createAsyncThunk(
  'factions/fetch',
  async (): Promise<{ factions: Faction[]; stats: Stats }> => {
    const { factions: raw } = await gql<{ factions: RawFaction[] }>(ROSTER_QUERY);

    const factions: Faction[] = raw.map(f => ({
      ...f,
      units: f.units.map((u): Unit => {
        const models = u.models.map(m => ({ ...m, stage: normalizeStage(m.stage) }));
        return {
          id:            u.id,
          factionId:     u.factionId,
          name:          u.name,
          photoUrl:      u.photoUrl,
          modelCount:    models.length,
          stageCounts:   computeStageCounts(models),
          completionPct: computeCompletionPct(models),
        };
      }),
    }));

    const allModels = raw.flatMap(f => f.units.flatMap(u =>
      u.models.map(m => ({ ...m, stage: normalizeStage(m.stage) }))
    ));
    return { factions, stats: computeStats(allModels) };
  },
  {
    condition: (_, { getState }) => {
      const { factions } = getState() as { factions: FactionState };
      return factions.items.length === 0;
    },
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const factionSlice = createSlice({
  name: 'factions',
  initialState,
  reducers: {
    // Sync actions used by mutation services after create/update/delete
    setFactions(state, action: PayloadAction<Faction[]>) {
      state.items = action.payload;
    },
    addFaction(state, action: PayloadAction<Faction>) {
      state.items.push(action.payload);
    },
    updateFaction(state, action: PayloadAction<Faction>) {
      const index = state.items.findIndex(f => f.id === action.payload.id);
      if (index !== -1) state.items[index] = action.payload;
    },
    removeFaction(state, action: PayloadAction<number>) {
      state.items = state.items.filter(f => f.id !== action.payload);
    },
    removeUnitFromFaction(state, action: PayloadAction<number>) {
      // action.payload = unitId
      for (const faction of state.items) {
        const idx = faction.units.findIndex(u => u.id === action.payload);
        if (idx !== -1) { faction.units.splice(idx, 1); break; }
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchRoster.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoster.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.factions;
      })
      .addCase(fetchRoster.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load roster';
      });
  },
});

export const {
  setFactions,
  addFaction,
  updateFaction,
  removeFaction,
  removeUnitFromFaction,
  setLoading,
  setError,
} = factionSlice.actions;

export default factionSlice.reducer;
