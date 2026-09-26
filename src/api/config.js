function trimTrailingSlash(url) {
  return String(url || '').replace(/\/+$/, '');
}

// Vite proxy only exists in local `vite`/`vite preview` — never on Vercel static hosting.
// Prefer an explicit API URL whenever it is set (Vercel env → baked in at build time).
const explicitBase = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL);
const useDevProxy =
  import.meta.env.DEV &&
  !explicitBase &&
  import.meta.env.VITE_USE_PROXY !== 'false';

export const apiConfig = {
  baseUrl: useDevProxy
    ? ''
    : explicitBase || 'https://ai-hire-one.vercel.app',
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
