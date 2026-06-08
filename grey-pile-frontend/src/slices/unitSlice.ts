import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { gql } from '../services/api';
import { Unit, UnitDetail, Model, Stage } from '../types';
import { computeCompletionPct, normalizeStage } from '../utils/stageUtils';

// ─── Raw API shape ────────────────────────────────────────────────────────────

interface RawModel { id: number; unitId: number; stage: string; photoUrl?: string; notes?: string; recipeId?: number; }

const UNIT_DETAIL_QUERY = `
  query FetchUnit($id: Long!) {
    units(where: { id: { eq: $id } }) {
      id factionId name photoUrl
      faction { name }
      models { id unitId stage photoUrl notes recipeId }
    }
  }
`;

// ─── State ────────────────────────────────────────────────────────────────────

interface UnitState {
  items: Unit[];
  detail: UnitDetail | null;  // the currently open unit in Model Detail
  loading: boolean;
  error: string | null;
}

const initialState: UnitState = {
  items: [],
  detail: null,
  loading: false,
  error: null,
};

// ─── Async: fetch unit detail ─────────────────────────────────────────────────
// Skipped automatically if the store already holds this unit's detail.
// Returns both detail and models so modelSlice can listen to the same action.

export const fetchUnitDetail = createAsyncThunk(
  'units/fetchDetail',
  async (id: number): Promise<{ detail: UnitDetail; models: Model[] }> => {
    const { units } = await gql<{ units: any[] }>(UNIT_DETAIL_QUERY, { id });
    const raw = units[0];
    if (!raw) throw new Error(`Unit ${id} not found`);

    const models: Model[] = raw.models.map((m: RawModel) => ({ ...m, stage: normalizeStage(m.stage) }));

    const detail: UnitDetail = {
      id:            raw.id,
      factionId:     raw.factionId,
      factionName:   raw.faction.name,
      name:          raw.name,
      photoUrl:      raw.photoUrl,
      modelCount:    models.length,
      models,
      progress:      models.map(m => m.stage),
      completionPct: computeCompletionPct(models),
    };

    return { detail, models };
  },
  {
    condition: (id, { getState }) => {
      const { units } = getState() as { units: UnitState };
      return units.detail?.id !== id;
    },
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const unitSlice = createSlice({
  name: 'units',
  initialState,
  reducers: {
    setUnits(state, action: PayloadAction<Unit[]>) {
      state.items = action.payload;
    },
    addUnit(state, action: PayloadAction<Unit>) {
      state.items.push(action.payload);
    },
    updateUnit(state, action: PayloadAction<Unit>) {
      const index = state.items.findIndex(u => u.id === action.payload.id);
      if (index !== -1) state.items[index] = action.payload;
    },
    removeUnit(state, action: PayloadAction<number>) {
      state.items = state.items.filter(u => u.id !== action.payload);
    },
    setUnitDetail(state, action: PayloadAction<UnitDetail>) {
      state.detail = action.payload;
    },
    clearUnitDetail(state) {
      state.detail = null;
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
      .addCase(fetchUnitDetail.pending, state => {
        state.loading = true;
        state.error = null;
        state.detail = null;
      })
      .addCase(fetchUnitDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload.detail;
      })
      .addCase(fetchUnitDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load unit';
      });
  },
});

export const {
  setUnits,
  addUnit,
  updateUnit,
  removeUnit,
  setUnitDetail,
  clearUnitDetail,
  setLoading,
  setError,
} = unitSlice.actions;

export default unitSlice.reducer;
