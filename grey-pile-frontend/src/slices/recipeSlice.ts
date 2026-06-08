import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { gql } from '../services/api';
import { Recipe } from '../types';

const RECIPES_QUERY = `
  query FetchRecipes {
    recipes {
      id name note factionId
      parts { id recipeId paintId sortOrder }
    }
  }
`;

interface RecipeState {
  items: Recipe[];
  loading: boolean;
  error: string | null;
}

const initialState: RecipeState = {
  items: [],
  loading: false,
  error: null,
};

// Skipped automatically if recipes are already in the store.
export const fetchRecipes = createAsyncThunk(
  'recipes/fetch',
  async (): Promise<Recipe[]> => {
    const { recipes } = await gql<{ recipes: Recipe[] }>(RECIPES_QUERY);
    return recipes;
  },
  {
    condition: (_, { getState }) => {
      const { recipes } = getState() as { recipes: RecipeState };
      return recipes.items.length === 0;
    },
  },
);

const recipeSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    setRecipes(state, action: PayloadAction<Recipe[]>) {
      state.items = action.payload;
    },
    addRecipe(state, action: PayloadAction<Recipe>) {
      state.items.push(action.payload);
    },
    updateRecipe(state, action: PayloadAction<Recipe>) {
      const index = state.items.findIndex(r => r.id === action.payload.id);
      if (index !== -1) state.items[index] = action.payload;
    },
    removeRecipe(state, action: PayloadAction<number>) {
      state.items = state.items.filter(r => r.id !== action.payload);
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
      .addCase(fetchRecipes.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchRecipes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load recipes';
      });
  },
});

export const {
  setRecipes,
  addRecipe,
  updateRecipe,
  removeRecipe,
  setLoading,
  setError,
} = recipeSlice.actions;

export default recipeSlice.reducer;
