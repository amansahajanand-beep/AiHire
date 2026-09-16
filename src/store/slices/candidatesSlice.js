import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  listCandidates,
  getCandidate,
  updateCandidateWorkflow,
} from '../../api/candidates';
import { shouldFetch } from '../cache';

function cacheKey({ jobId, status } = {}) {
  return `${jobId || 'all'}::${status || 'all'}`;
}

export const fetchCandidates = createAsyncThunk(
  'candidates/fetchList',
  async (arg = {}) => {
    const params = { jobId: arg.jobId, status: arg.status };
    const result = await listCandidates(params);
    return { key: cacheKey(params), ...result };
  },
  {
    condition: (arg = {}, { getState }) => {
      const key = cacheKey(arg);
      const entry = getState().candidates.lists[key];
      return shouldFetch({
        force: arg.force,
        status: entry?.status,
        fetchedAt: entry?.fetchedAt,
        hasData: Array.isArray(entry?.items),
      });
    },
  }
);

export const fetchCandidateById = createAsyncThunk(
  'candidates/fetchById',
  async ({ id }) => getCandidate(id),
  {
    condition: ({ id, force } = {}, { getState }) => {
      const entry = getState().candidates.byId[id];
      return shouldFetch({
        force,
        status: entry?.status,
        fetchedAt: entry?.fetchedAt,
        hasData: entry?.data != null,
      });
    },
  }
);

export const patchCandidateWorkflow = createAsyncThunk(
  'candidates/patchWorkflow',
  async ({ id, payload }) => updateCandidateWorkflow(id, payload)
);

const initialState = {
  lists: {},
  byId: {},
};

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    invalidateCandidates(state) {
      Object.keys(state.lists).forEach((key) => {
        if (state.lists[key]) state.lists[key].fetchedAt = null;
      });
      Object.keys(state.byId).forEach((id) => {
        if (state.byId[id]) state.byId[id].fetchedAt = null;
      });
    },
    resetCandidates() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCandidates.pending, (state, action) => {
        const key = cacheKey(action.meta.arg || {});
        state.lists[key] = {
          ...(state.lists[key] || { items: [], source: 'live' }),
          status: 'loading',
          error: null,
        };
      })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        const { key, candidates, source } = action.payload;
        state.lists[key] = {
          items: candidates || [],
          source: source || 'live',
          status: 'succeeded',
          error: null,
          fetchedAt: Date.now(),
        };
        (candidates || []).forEach((c) => {
          state.byId[c.id] = {
            data: c,
            status: 'succeeded',
            error: null,
            fetchedAt: Date.now(),
          };
        });
      })
      .addCase(fetchCandidates.rejected, (state, action) => {
        const key = cacheKey(action.meta.arg || {});
        state.lists[key] = {
          ...(state.lists[key] || { items: [], source: 'live' }),
          status: 'failed',
          error: action.error.message,
        };
      })
      .addCase(fetchCandidateById.pending, (state, action) => {
        const id = action.meta.arg.id;
        state.byId[id] = {
          ...(state.byId[id] || { data: null }),
          status: 'loading',
          error: null,
        };
      })
      .addCase(fetchCandidateById.fulfilled, (state, action) => {
        const c = action.payload;
        state.byId[c.id] = {
          data: c,
          status: 'succeeded',
          error: null,
          fetchedAt: Date.now(),
        };
      })
      .addCase(fetchCandidateById.rejected, (state, action) => {
        const id = action.meta.arg.id;
        state.byId[id] = {
          ...(state.byId[id] || { data: null }),
          status: 'failed',
          error: action.error.message,
        };
      })
      .addCase(patchCandidateWorkflow.fulfilled, (state, action) => {
        const c = action.payload;
        state.byId[c.id] = {
          data: c,
          status: 'succeeded',
          error: null,
          fetchedAt: Date.now(),
        };
        Object.keys(state.lists).forEach((key) => {
          const list = state.lists[key];
          if (!list?.items) return;
          const idx = list.items.findIndex((item) => item.id === c.id);
          if (idx >= 0) list.items[idx] = c;
          list.fetchedAt = null; // refresh list next visit
        });
      });
  },
});

export const { invalidateCandidates, resetCandidates } = candidatesSlice.actions;
export default candidatesSlice.reducer;
