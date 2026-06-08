// Paint mutations — paint and recipe write operations.
// Fetch operations live in their respective slices (fetchPaints, fetchRecipes).

import { gql } from './api';
import { AppThunk } from '../store';
import { fetchRecipes } from '../slices/recipeSlice';
import { addPaint, updatePaint as updatePaintInStore, removePaint } from '../slices/paintSlice';
import { addRecipe, updateRecipe as updateRecipeInStore, removeRecipe, setRecipes } from '../slices/recipeSlice';
import { Paint, Recipe, PaintType } from '../types';

// ─── Paints ───────────────────────────────────────────────────────────────────

export const createPaint = (input: {
  name: string; hex: string; type: PaintType; isFavourite?: boolean; partnerId?: number;
}): AppThunk<Promise<Paint>> => async (dispatch) => {
  const { createPaint: paint } = await gql<{ createPaint: Paint }>(`
    mutation CreatePaint($input: CreatePaintInput!) {
      createPaint(input: $input) { id name hex type isFavourite partnerId }
    }
  `, { input });
  dispatch(addPaint(paint));
  return paint;
};

export const updatePaint = (input: {
  id: number; name?: string; hex?: string; type?: PaintType; isFavourite?: boolean; partnerId?: number;
}): AppThunk => async (dispatch) => {
  const { updatePaint: paint } = await gql<{ updatePaint: Paint | null }>(`
    mutation UpdatePaint($input: UpdatePaintInput!) {
      updatePaint(input: $input) { id name hex type isFavourite partnerId }
    }
  `, { input });
  if (paint) dispatch(updatePaintInStore(paint));
};

export const deletePaint = (id: number): AppThunk => async (dispatch) => {
  await gql(`mutation { deletePaint(id: ${id}) }`);
  dispatch(removePaint(id));
};

// ─── Recipes ──────────────────────────────────────────────────────────────────

export const createRecipe = (input: {
  name: string; note?: string; factionId?: number | null; paintIds?: number[];
}): AppThunk => async (dispatch) => {
  const { paintIds, ...recipeInput } = input;
  const { createRecipe: recipe } = await gql<{ createRecipe: Recipe }>(`
    mutation CreateRecipe($input: CreateRecipeInput!) {
      createRecipe(input: $input) { id name note factionId parts { id recipeId paintId sortOrder } }
    }
  `, { input: recipeInput });

  for (let i = 0; i < (paintIds ?? []).length; i++) {
    await gql(`
      mutation AddRecipePart($input: AddRecipePartInput!) {
        addRecipePart(input: $input) { id }
      }
    `, { input: { recipeId: recipe.id, paintId: paintIds![i], sortOrder: i } });
  }

  dispatch(setRecipes([]));
  await dispatch(fetchRecipes());
};

export const updateRecipe = (input: { id: number; name?: string; note?: string }): AppThunk => async (dispatch) => {
  const { updateRecipe: recipe } = await gql<{ updateRecipe: Recipe | null }>(`
    mutation UpdateRecipe($input: UpdateRecipeInput!) {
      updateRecipe(input: $input) { id name note parts { id recipeId paintId sortOrder } }
    }
  `, { input });
  if (recipe) dispatch(updateRecipeInStore(recipe));
};

export const deleteRecipe = (id: number): AppThunk => async (dispatch) => {
  await gql(`mutation { deleteRecipe(id: ${id}) }`);
  dispatch(removeRecipe(id));
};

// Parts mutate the parent recipe's parts array — re-fetch recipes to stay consistent.

export const addRecipePart = (input: {
  recipeId: number; paintId: number; sortOrder: number;
}): AppThunk => async (dispatch) => {
  await gql(`
    mutation AddRecipePart($input: AddRecipePartInput!) {
      addRecipePart(input: $input) { id recipeId paintId sortOrder }
    }
  `, { input });
  dispatch(setRecipes([]));
  dispatch(fetchRecipes());
};

export const removeRecipePart = (id: number): AppThunk => async (dispatch) => {
  await gql(`mutation { removeRecipePart(id: ${id}) }`);
  dispatch(setRecipes([]));
  dispatch(fetchRecipes());
};
