import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getHiringActivity } from '../../api/candidates';
import { shouldFetch } from '../cache';

function activityKey(type = 'All') {
  return type || 'All';
}

export const fetchHiringActivity = createAsyncThunk(
  'activity/fetch',
  async (arg = {}) => {
    const type = arg.type || 'All';
    const activities = await getHiringActivity({ type, limit: arg.limit ?? 100 });
    return { key: activityKey(type), activities };
  },
  {
    condition: (arg = {}, { getState }) => {
      const key = activityKey(arg.type);
      const entry = getState().activity.byType[key];
      return shouldFetch({
        force: arg.force,
        status: entry?.status,
        fetchedAt: entry?.fetchedAt,
        hasData: Array.isArray(entry?.items),
      });
    },
  }
);

const initialState = {
  byType: {},
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    invalidateActivity(state) {
      Object.keys(state.byType).forEach((key) => {
        if (state.byType[key]) state.byType[key].fetchedAt = null;
      });
    },
    resetActivity() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHiringActivity.pending, (state, action) => {
        const key = activityKey(action.meta.arg?.type);
        state.byType[key] = {
          ...(state.byType[key] || { items: [] }),
          status: 'loading',
          error: null,
        };
      })
      .addCase(fetchHiringActivity.fulfilled, (state, action) => {
        const { key, activities } = action.payload;
        state.byType[key] = {
          items: activities || [],
          status: 'succeeded',
          error: null,
          fetchedAt: Date.now(),
        };
      })
      .addCase(fetchHiringActivity.rejected, (state, action) => {
        const key = activityKey(action.meta.arg?.type);
        state.byType[key] = {
          ...(state.byType[key] || { items: [] }),
          status: 'failed',
          error: action.error.message,
        };
      });
  },
});

export const { invalidateActivity, resetActivity } = activitySlice.actions;
export default activitySlice.reducer;
