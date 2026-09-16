import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { listJobs, createJob, deleteJob } from '../../api/jobs';
import { shouldFetch } from '../cache';

export const fetchJobs = createAsyncThunk(
  'jobs/fetchList',
  async (arg = {}) => listJobs({ status: arg.status }),
  {
    condition: (arg = {}, { getState }) => {
      const { items, status, fetchedAt } = getState().jobs;
      return shouldFetch({
        force: arg.force,
        status,
        fetchedAt,
        hasData: Array.isArray(items) && fetchedAt != null,
      });
    },
  }
);

export const createJobThunk = createAsyncThunk(
  'jobs/create',
  async (payload) => createJob(payload)
);

export const removeJobThunk = createAsyncThunk(
  'jobs/remove',
  async (jobId) => {
    await deleteJob(jobId);
    return jobId;
  }
);

const initialState = {
  items: [],
  source: 'live',
  status: 'idle',
  error: null,
  fetchedAt: null,
};

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    invalidateJobs(state) {
      state.fetchedAt = null;
    },
    resetJobs() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload?.jobs || [];
        state.source = action.payload?.source || 'live';
        state.fetchedAt = Date.now();
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createJobThunk.fulfilled, (state, action) => {
        const job = action.payload?.job;
        if (job) {
          state.items = [job, ...state.items.filter((j) => j.id !== job.id)];
        }
        state.fetchedAt = null;
      })
      .addCase(removeJobThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((j) => j.id !== action.payload);
        state.fetchedAt = null;
      });
  },
});

export const { invalidateJobs, resetJobs } = jobsSlice.actions;
export default jobsSlice.reducer;
