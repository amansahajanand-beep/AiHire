const useProxy = import.meta.env.VITE_USE_PROXY !== 'false';

export const apiConfig = {
  // When proxy is on, browser calls same-origin /api → Vite → FastAPI
  baseUrl: useProxy ? '' : (import.meta.env.VITE_API_BASE_URL || 'https://ai-hire-one.vercel.app'),
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
