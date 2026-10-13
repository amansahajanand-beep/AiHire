import { apiPostJson, apiGet, apiPatchJson, apiPutJson, apiDelete } from './client';
import { setAuthSession, clearAuthSession, getStoredUser } from './config';

/** Register — matches frontend fields: name, email, company, city, country, password, confirmPassword */
export async function register({ name, email, password, confirmPassword, company, city, country }) {
  const data = await apiPostJson('/api/auth/register', {
    name,
    email,
    password,
    confirmPassword,
    company,
    city,
    country,
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

export const forgotPassword = (email) => apiPostJson('/api/auth/forgot-password', { email });

export const resetPassword = ({ token, password, confirmPassword }) =>
  apiPostJson('/api/auth/reset-password', { token, password, confirmPassword });

export const changePassword = ({ currentPassword, password, confirmPassword }) =>
  apiPostJson('/api/auth/change-password', {
    current_password: currentPassword,
    password,
    confirmPassword,
  });

export async function setAvatar(image) {
  const user = await apiPutJson('/api/auth/avatar', { image });
  setAuthSession({ user });
  return user;
}

export async function removeAvatar() {
  const user = await apiDelete('/api/auth/avatar');
  setAuthSession({ user });
  return user;
}

export async function updateProfile({ name, phone }) {
  const user = await apiPatchJson('/api/auth/me', { name, phone });
  setAuthSession({ user });
  return user;
}
