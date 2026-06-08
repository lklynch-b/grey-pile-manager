// Roster mutations — faction, unit, and model write operations.
// Fetch operations live in their respective slices (fetchRoster, fetchUnitDetail).

import { gql } from './api';
import { AppThunk } from '../store';
import { fetchUnitDetail } from '../slices/unitSlice';
import { addFaction, updateFaction as updateFactionInStore, removeFaction, removeUnitFromFaction } from '../slices/factionSlice';
import { updateModel, removeModel } from '../slices/modelSlice';
import { removeUnitFromAllEvents } from '../slices/eventSlice';
import { setStats } from '../slices/statsSlice';
import { Stage, Unit } from '../types';
import { computeStageCounts, computeCompletionPct, computeStats, normalizeStage, STAGE_ORDER } from '../utils/stageUtils';

// ─── Factions ─────────────────────────────────────────────────────────────────

export const createFaction = (
  input: { name: string; blurb?: string; accent?: string; tint?: string },
): AppThunk => async (dispatch) => {
  const { createFaction: faction } = await gql<{ createFaction: any }>(`
    mutation CreateFaction($input: CreateFactionInput!) {
      createFaction(input: $input) { id name blurb accent tint }
    }
  `, { input });
  dispatch(addFaction({ ...faction, units: [] }));
};

export const updateFaction = (
  input: { id: number; name?: string; blurb?: string; accent?: string; tint?: string },
): AppThunk => async (dispatch, getState) => {
  const { updateFaction: faction } = await gql<{ updateFaction: any }>(`
    mutation UpdateFaction($input: UpdateFactionInput!) {
      updateFaction(input: $input) { id name blurb accent tint }
    }
  `, { input });
  if (!faction) return;
  const existing = getState().factions.items.find(f => f.id === faction.id);
  if (existing) dispatch(updateFactionInStore({ ...existing, ...faction }));
};

export const deleteFaction = (id: number): AppThunk => async (dispatch) => {
  await gql(`mutation { deleteFaction(id: ${id}) }`);
  dispatch(removeFaction(id));
};

// ─── Units ────────────────────────────────────────────────────────────────────

// Creates a unit + N models, matching or creating the faction by name.
// Updates the store directly from the mutation response so the roster and stats
// reflect the change immediately — no re-fetch needed, bulk adds work in sequence.
export const createUnitWithModels = (
  input: { factionName: string; unitName: string; count: number; stage: Stage },
): AppThunk => async (dispatch, getState) => {
  interface RawUnit { id: number; factionId: number; name: string; models: { id: number; stage: string }[]; }

  const { createUnitWithModels: raw } = await gql<{ createUnitWithModels: RawUnit }>(`
    mutation CreateUnitWithModels($input: CreateUnitWithModelsInput!) {
      createUnitWithModels(input: $input) {
        id factionId name
        models { id stage }
      }
    }
  `, { input });

  const models = raw.models.map(m => ({ ...m, stage: normalizeStage(m.stage) }));

  const newUnit: Unit = {
    id:            raw.id,
    factionId:     raw.factionId,
    name:          raw.name,
    modelCount:    models.length,
    stageCounts:   computeStageCounts(models),
    completionPct: computeCompletionPct(models),
  };

  const existingFaction = getState().factions.items.find(f => f.id === raw.factionId);

  if (existingFaction) {
    dispatch(updateFactionInStore({ ...existingFaction, units: [...existingFaction.units, newUnit] }));
  } else {
    dispatch(addFaction({ id: raw.factionId, name: input.factionName, units: [newUnit] }));
  }

  // Recompute global stats from the updated store
  const allModelStages = getState().factions.items.flatMap(f =>
    f.units.flatMap(u =>
      STAGE_ORDER.flatMap(s => Array<{ stage: Stage }>(u.stageCounts[s]).fill({ stage: s }))
    )
  );
  dispatch(setStats(computeStats(allModelStages)));
};

// ─── Models ───────────────────────────────────────────────────────────────────

// Adds N models to an existing unit. Re-fetches unit detail to get the
// server-assigned IDs for the new rows, then syncs faction stageCounts.
export const addModels = (
  input: { unitId: number; count: number; stage: Stage },
): AppThunk => async (dispatch, getState) => {
  await gql(`
    mutation AddModels($input: AddModelsInput!) {
      addModels(input: $input) { unitId modelsCreated }
    }
  `, { input });
  await dispatch(fetchUnitDetail(input.unitId));
  syncUnitAndStats(dispatch, getState, input.unitId);
};

export const advanceStage = (modelId: number): AppThunk => async (dispatch, getState) => {
  const { advanceStage: raw } = await gql<{ advanceStage: any }>(`
    mutation AdvanceStage($modelId: Long!) {
      advanceStage(modelId: $modelId) { id unitId stage notes recipeId }
    }
  `, { modelId });
  if (!raw) return;

  const model = { ...raw, stage: normalizeStage(raw.stage) };
  dispatch(updateModel(model));
  syncUnitAndStats(dispatch, getState, model.unitId);
};

export const setStage = (modelId: number, stage: Stage): AppThunk => async (dispatch, getState) => {
  const { setStage: raw } = await gql<{ setStage: any }>(`
    mutation SetStage($modelId: Long!, $stage: Stage!) {
      setStage(modelId: $modelId, stage: $stage) { id unitId stage notes recipeId }
    }
  `, { modelId, stage });
  if (!raw) return;

  const model = { ...raw, stage: normalizeStage(raw.stage) };
  dispatch(updateModel(model));
  syncUnitAndStats(dispatch, getState, model.unitId);
};

export const updateModelNotes = (modelId: number, notes: string | null): AppThunk => async (dispatch) => {
  const { updateModelNotes: model } = await gql<{ updateModelNotes: any }>(`
    mutation UpdateModelNotes($modelId: Long!, $notes: String) {
      updateModelNotes(modelId: $modelId, notes: $notes) { id unitId stage notes recipeId }
    }
  `, { modelId, notes });
  if (model) dispatch(updateModel(model));
};

export const assignRecipe = (modelId: number, recipeId: number | null): AppThunk => async (dispatch) => {
  const { assignRecipe: model } = await gql<{ assignRecipe: any }>(`
    mutation AssignRecipe($modelId: Long!, $recipeId: Long) {
      assignRecipe(modelId: $modelId, recipeId: $recipeId) { id unitId stage notes recipeId }
    }
  `, { modelId, recipeId });
  if (model) dispatch(updateModel(model));
};

export const deleteModel = (id: number, unitId: number): AppThunk => async (dispatch, getState) => {
  await gql(`mutation { deleteModel(id: ${id}) }`);
  dispatch(removeModel(id));
  syncUnitAndStats(dispatch, getState, unitId);
};

// Deletes the whole unit (cascades to models + event_units on the DB side) and
// cleans up every store slice that references the unit.
export const deleteUnit = (unitId: number): AppThunk => async (dispatch, getState) => {
  await gql(`mutation { deleteUnit(id: ${unitId}) }`);
  dispatch(removeUnitFromFaction(unitId));
  dispatch(removeUnitFromAllEvents(unitId));

  // Recompute global stats from what remains
  const factions = getState().factions.items;
  const allModelStages = factions.flatMap(f =>
    f.units.flatMap(u =>
      STAGE_ORDER.flatMap(s => Array<{ stage: Stage }>(u.stageCounts[s]).fill({ stage: s }))
    )
  );
  dispatch(setStats(computeStats(allModelStages)));
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

// After any model stage change, recompute the parent unit's stageCounts /
// completionPct in the faction store and refresh global stats — all from the
// models already in state.models.items so no extra network call is needed.
function syncUnitAndStats(
  dispatch: any,
  getState:  () => ReturnType<typeof import('../store').default.getState>,
  unitId:    number,
) {
  const state   = getState();
  const models  = state.models.items;
  const factions = state.factions.items;

  const faction = factions.find(f => f.units.some(u => u.id === unitId));
  if (!faction) return;

  const updatedUnits = faction.units.map(u => {
    if (u.id !== unitId) return u;
    const unitModels = models.filter(m => m.unitId === unitId);
    return {
      ...u,
      stageCounts:   computeStageCounts(unitModels),
      completionPct: computeCompletionPct(unitModels),
    };
  });

  dispatch(updateFactionInStore({ ...faction, units: updatedUnits }));

  // Recompute global stats from all factions
  const allModelStages = [...factions]
    .map(f => f.id === faction.id ? { ...faction, units: updatedUnits } : f)
    .flatMap(f => f.units.flatMap(u =>
      STAGE_ORDER.flatMap(s => Array<{ stage: Stage }>(u.stageCounts[s]).fill({ stage: s }))
    ));
  dispatch(setStats(computeStats(allModelStages)));
}
