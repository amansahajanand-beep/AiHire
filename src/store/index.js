import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer, { invalidateDashboard, resetDashboard } from './slices/dashboardSlice';
import candidatesReducer, { invalidateCandidates, resetCandidates } from './slices/candidatesSlice';
import jobsReducer, { invalidateJobs, resetJobs } from './slices/jobsSlice';
import activityReducer, { invalidateActivity, resetActivity } from './slices/activitySlice';

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    candidates: candidatesReducer,
    jobs: jobsReducer,
    activity: activityReducer,
  },
});

/** Mark all hiring-related caches stale so the next visit refetches. */
export function invalidateHiringData(dispatch) {
  dispatch(invalidateDashboard());
  dispatch(invalidateCandidates());
  dispatch(invalidateJobs());
  dispatch(invalidateActivity());
}

/** Clear all cached API data (e.g. on logout). */
export function resetHiringData(dispatch) {
  dispatch(resetDashboard());
  dispatch(resetCandidates());
  dispatch(resetJobs());
  dispatch(resetActivity());
}

export default store;
