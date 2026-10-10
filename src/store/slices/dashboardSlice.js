import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getDashboardTotals,
  getScreeningOverview,
  getHiringPipeline,
} from '../../api/candidates';
import { shouldFetch } from '../cache';

export const fetchDashboardTotals = createAsyncThunk(
  'dashboard/fetchTotals',
  async () => getDashboardTotals(),
  {
    condition: (arg, { getState }) => {
      const { totals, totalsStatus, totalsFetchedAt } = getState().dashboard;
      return shouldFetch({
        force: arg?.force,
        status: totalsStatus,
        fetchedAt: totalsFetchedAt,
        hasData: totals != null,
      });
    },
  }
);

export const fetchScreeningOverview = createAsyncThunk(
  'dashboard/fetchScreeningOverview',
  async (arg = {}) => getScreeningOverview({ period: arg.period ?? 'week' }),
  {
    condition: (arg, { getState }) => {
      const { overview, overviewStatus, overviewFetchedAt, overviewPeriod } = getState().dashboard;
      return shouldFetch({
        force: arg?.force || (arg?.period ?? 'week') !== overviewPeriod,
        status: overviewStatus,
        fetchedAt: overviewFetchedAt,
        hasData: Array.isArray(overview) && overviewFetchedAt != null,
      });
    },
  }
);

export const fetchHiringPipeline = createAsyncThunk(
  'dashboard/fetchPipeline',
  async (arg = {}) => getHiringPipeline({ period: arg.period ?? 'all' }),
  {
    condition: (arg, { getState }) => {
      const { pipeline, pipelineStatus, pipelineFetchedAt, pipelinePeriod } = getState().dashboard;
      return shouldFetch({
        force: arg?.force || (arg?.period ?? 'all') !== pipelinePeriod,
        status: pipelineStatus,
        fetchedAt: pipelineFetchedAt,
        hasData: Array.isArray(pipeline) && pipelineFetchedAt != null,
      });
    },
  }
);

const initialState = {
  totals: null,
  totalsStatus: 'idle',
  totalsError: null,
  totalsFetchedAt: null,

  overview: [],
  overviewStatus: 'idle',
  overviewError: null,
  overviewFetchedAt: null,
  overviewPeriod: 'week',

  pipeline: [],
  pipelineStatus: 'idle',
  pipelineError: null,
  pipelineFetchedAt: null,
  pipelinePeriod: 'all',
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    invalidateDashboard(state) {
      state.totalsFetchedAt = null;
      state.overviewFetchedAt = null;
      state.pipelineFetchedAt = null;
    },
    resetDashboard() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardTotals.pending, (state) => {
        state.totalsStatus = 'loading';
        state.totalsError = null;
      })
      .addCase(fetchDashboardTotals.fulfilled, (state, action) => {
        state.totalsStatus = 'succeeded';
        state.totals = action.payload;
        state.totalsFetchedAt = Date.now();
      })
      .addCase(fetchDashboardTotals.rejected, (state, action) => {
        state.totalsStatus = 'failed';
        state.totalsError = action.error.message;
      })
      .addCase(fetchScreeningOverview.pending, (state, action) => {
        state.overviewStatus = 'loading';
        state.overviewPeriod = action.meta.arg?.period ?? 'week';
        state.overviewError = null;
      })
      .addCase(fetchScreeningOverview.fulfilled, (state, action) => {
        state.overviewStatus = 'succeeded';
        state.overview = action.payload || [];
        state.overviewFetchedAt = Date.now();
      })
      .addCase(fetchScreeningOverview.rejected, (state, action) => {
        state.overviewStatus = 'failed';
        state.overviewError = action.error.message;
      })
      .addCase(fetchHiringPipeline.pending, (state, action) => {
        state.pipelineStatus = 'loading';
        state.pipelinePeriod = action.meta.arg?.period ?? 'all';
        state.pipelineError = null;
      })
      .addCase(fetchHiringPipeline.fulfilled, (state, action) => {
        state.pipelineStatus = 'succeeded';
        state.pipeline = action.payload || [];
        state.pipelineFetchedAt = Date.now();
      })
      .addCase(fetchHiringPipeline.rejected, (state, action) => {
        state.pipelineStatus = 'failed';
        state.pipelineError = action.error.message;
      });
  },
});

export const { invalidateDashboard, resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
