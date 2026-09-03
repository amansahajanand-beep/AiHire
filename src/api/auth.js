import { apiPostJson, apiGet } from './client';
import { setAuthSession, clearAuthSession, getStoredUser } from './config';

/** Register — matches frontend fields: name, email, password, confirmPassword */
export async function register({ name, email, password, confirmPassword, company }) {
  const data = await apiPostJson('/api/auth/register', {
    name,
    email,
    password,
    confirmPassword,
    company,
  });
  setAuthSession(data);
  return data;
}

/** Login — matches frontend fields: email, password */
export async function login({ email, password }) {
  const data = await apiPostJson('/api/auth/login', { email, password });
  setAuthSession(data);
  return data;
}

export async function fetchMe() {
  return apiGet('/api/auth/me');
}

export function logout() {
  clearAuthSession();
}

export function getCurrentUser() {
  return getStoredUser();
}
