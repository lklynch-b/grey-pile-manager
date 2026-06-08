import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Model } from '../types';
import { fetchUnitDetail } from './unitSlice';

interface ModelState {
  items: Model[];  // models for the currently open unit
  loading: boolean;
  error: string | null;
}

const initialState: ModelState = {
  items: [],
  loading: false,
  error: null,
};

const modelSlice = createSlice({
  name: 'models',
  initialState,
  reducers: {
    setModels(state, action: PayloadAction<Model[]>) {
      state.items = action.payload;
    },
    addModels(state, action: PayloadAction<Model[]>) {
      state.items.push(...action.payload);
    },
    updateModel(state, action: PayloadAction<Model>) {
      const index = state.items.findIndex(m => m.id === action.payload.id);
      if (index !== -1) state.items[index] = action.payload;
    },
    removeModel(state, action: PayloadAction<number>) {
      state.items = state.items.filter(m => m.id !== action.payload);
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
  extraReducers: builder => {
    // Models load as a side-effect of fetching unit detail — no separate call needed.
    builder
      .addCase(fetchUnitDetail.pending, state => {
        state.loading = true;
        state.items = [];
      })
      .addCase(fetchUnitDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.models;
      })
      .addCase(fetchUnitDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load models';
      });
  },
});

export const {
  setModels,
  addModels,
  updateModel,
  removeModel,
  setLoading,
  setError,
} = modelSlice.actions;

export default modelSlice.reducer;
