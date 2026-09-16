/** How long cached API data is treated as fresh before a background refetch. */
export const STALE_MS = 60_000; // 1 minute

export function isFresh(fetchedAt, staleMs = STALE_MS) {
  if (!fetchedAt) return false;
  return Date.now() - fetchedAt < staleMs;
}

/**
 * Skip dispatch when:
 * - already loading, or
 * - cache is fresh and force was not requested
 */
export function shouldFetch({ force, status, fetchedAt, hasData, staleMs = STALE_MS }) {
  if (force) return true;
  if (status === 'loading') return false;
  if (hasData && isFresh(fetchedAt, staleMs)) return false;
  return true;
}
