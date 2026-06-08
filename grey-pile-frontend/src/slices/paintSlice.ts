import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { gql } from '../services/api';
import { Paint, PaintType } from '../types';

const PAINTS_QUERY = `
  query FetchPaints {
    paints(order: { name: ASC }) {
      id name hex type isFavourite partnerId
    }
  }
`;

interface PaintState {
  items: Paint[];
  activeFilter: PaintType | 'all' | 'favourites';
  loading: boolean;
  error: string | null;
}

const initialState: PaintState = {
  items: [],
  activeFilter: 'all',
  loading: false,
  error: null,
};

// Skipped automatically if paints are already in the store.
export const fetchPaints = createAsyncThunk(
  'paints/fetch',
  async (): Promise<Paint[]> => {
    const { paints } = await gql<{ paints: Paint[] }>(PAINTS_QUERY);
    return paints;
  },
  {
    condition: (_, { getState }) => {
      const { paints } = getState() as { paints: PaintState };
      return paints.items.length === 0;
    },
  },
);

const paintSlice = createSlice({
  name: 'paints',
  initialState,
  reducers: {
    setPaints(state, action: PayloadAction<Paint[]>) {
      state.items = action.payload;
    },
    addPaint(state, action: PayloadAction<Paint>) {
      state.items.push(action.payload);
    },
    updatePaint(state, action: PayloadAction<Paint>) {
      const index = state.items.findIndex(p => p.id === action.payload.id);
      if (index !== -1) state.items[index] = action.payload;
    },
    removePaint(state, action: PayloadAction<number>) {
      state.items = state.items.filter(p => p.id !== action.payload);
    },
    setFilter(state, action: PayloadAction<PaintType | 'all' | 'favourites'>) {
      state.activeFilter = action.payload;
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
      .addCase(fetchPaints.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaints.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPaints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load paints';
      });
  },
});

export const {
  setPaints,
  addPaint,
  updatePaint,
  removePaint,
  setFilter,
  setLoading,
  setError,
} = paintSlice.actions;

export default paintSlice.reducer;
