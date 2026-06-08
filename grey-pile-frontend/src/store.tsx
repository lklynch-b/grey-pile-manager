import { configureStore, ThunkAction, Action, ThunkDispatch } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import factionReducer from './slices/factionSlice';
import unitReducer    from './slices/unitSlice';
import modelReducer   from './slices/modelSlice';
import paintReducer   from './slices/paintSlice';
import recipeReducer  from './slices/recipeSlice';
import eventReducer   from './slices/eventSlice';
import statsReducer   from './slices/statsSlice';

const store = configureStore({
  reducer: {
    factions: factionReducer,
    units:    unitReducer,
    models:   modelReducer,
    paints:   paintReducer,
    recipes:  recipeReducer,
    events:   eventReducer,
    stats:    statsReducer,
  },
});

// ─── Typed hooks ──────────────────────────────────────────────────────────────
// Use these everywhere instead of plain useDispatch / useSelector.
//
//   const dispatch = useAppDispatch();
//   const factions = useAppSelector(state => state.factions.items);

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch & ThunkDispatch<RootState, unknown, Action<string>>;
export type AppThunk<R = void> = ThunkAction<R, RootState, unknown, Action<string>>;

export const useAppDispatch: () => AppDispatch          = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
