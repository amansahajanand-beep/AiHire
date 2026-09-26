/**
 * API base URL resolution
 *
 * Production (Vercel frontend): use same-origin `/api/*`.
 * vercel.json proxies those to the FastAPI backend, which avoids CORS.
 *
 * Local Vite: leave VITE_API_BASE_URL unset to use the Vite proxy, or set it
 * to hit the backend directly.
 */
function trimTrailingSlash(url) {
  return String(url || '').replace(/\/+$/, '');
}

const explicitBase = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL);
const useSameOriginProxy =
  import.meta.env.PROD ||
  (import.meta.env.DEV && !explicitBase && import.meta.env.VITE_USE_PROXY !== 'false');

export const apiConfig = {
  // Empty string => browser calls /api/... on the current host
  baseUrl: useSameOriginProxy ? '' : explicitBase || 'https://ai-hire-one.vercel.app',
};

export function getToken() {
  return localStorage.getItem('hireai_token') || '';
}

export function setAuthSession({ access_token, user }) {
  if (access_token) localStorage.setItem('hireai_token', access_token);
  if (user) localStorage.setItem('hireai_user', JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem('hireai_token');
  localStorage.removeItem('hireai_user');
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('hireai_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
