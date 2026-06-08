import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { gql } from '../services/api';
import { Event } from '../types';

const EVENTS_QUERY = `
  query FetchEvents {
    events(order: { eventDate: ASC }) {
      id name shortName venue eventDate scope modelsNeeded color
      eventUnits { unitId }
    }
  }
`;

interface EventState {
  items: Event[];  // always kept sorted by eventDate ascending
  loading: boolean;
  error: string | null;
}

const initialState: EventState = {
  items: [],
  loading: false,
  error: null,
};

// Skipped automatically if events are already in the store.
interface RawEvent extends Omit<Event, 'unitIds'> {
  eventUnits: { unitId: number }[];
}

export const fetchEvents = createAsyncThunk(
  'events/fetch',
  async (): Promise<Event[]> => {
    const { events } = await gql<{ events: RawEvent[] }>(EVENTS_QUERY);
    return events.map(e => ({ ...e, unitIds: e.eventUnits.map(eu => eu.unitId) }));
  },
  {
    condition: (_, { getState }) => {
      const { events } = getState() as { events: EventState };
      return events.items.length === 0;
    },
  },
);

const eventSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setEvents(state, action: PayloadAction<Event[]>) {
      state.items = action.payload;
    },
    addEvent(state, action: PayloadAction<Event>) {
      state.items.push(action.payload);
      state.items.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    },
    updateEvent(state, action: PayloadAction<Event>) {
      const index = state.items.findIndex(e => e.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
        state.items.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
      }
    },
    removeEvent(state, action: PayloadAction<number>) {
      state.items = state.items.filter(e => e.id !== action.payload);
    },
    removeUnitFromAllEvents(state, action: PayloadAction<number>) {
      // action.payload = unitId — cleans up after a unit is deleted
      for (const ev of state.items) {
        ev.unitIds = ev.unitIds.filter(id => Number(id) !== Number(action.payload));
      }
    },
    addUnitToEvent(state, action: PayloadAction<{ eventId: number; unitId: number }>) {
      const ev = state.items.find(e => e.id === action.payload.eventId);
      if (ev && !ev.unitIds.includes(action.payload.unitId)) {
        ev.unitIds.push(action.payload.unitId);
      }
    },
    removeUnitFromEvent(state, action: PayloadAction<{ eventId: number; unitId: number }>) {
      const ev = state.items.find(e => e.id === action.payload.eventId);
      if (ev) ev.unitIds = ev.unitIds.filter(id => id !== action.payload.unitId);
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
      .addCase(fetchEvents.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load events';
      });
  },
});

export const {
  setEvents,
  addEvent,
  updateEvent,
  removeEvent,
  addUnitToEvent,
  removeUnitFromEvent,
  removeUnitFromAllEvents,
  setLoading,
  setError,
} = eventSlice.actions;

export default eventSlice.reducer;
