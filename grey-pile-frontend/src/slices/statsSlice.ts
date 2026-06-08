import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Stats } from '../types';
import { fetchRoster } from './factionSlice';

interface StatsState {
  data: Stats | null;
  loading: boolean;
  error: string | null;
}

const initialState: StatsState = {
  data: null,
  loading: false,
  error: null,
};

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    // Used when stats need to be refreshed directly (e.g. after a stage mutation)
    setStats(state, action: PayloadAction<Stats>) {
      state.data = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
  extraReducers: builder => {
    // Stats are computed from model stages returned in the roster payload —
    // no separate API call needed.
    builder.addCase(fetchRoster.fulfilled, (state, action) => {
      state.data = action.payload.stats;
    });
  },
});

export const { setStats, setLoading, setError } = statsSlice.actions;

export default statsSlice.reducer;
