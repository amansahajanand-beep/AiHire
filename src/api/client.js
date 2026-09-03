import { apiConfig, getToken, clearAuthSession } from './config';

export class ApiError extends Error {
  constructor(message, { status, payload } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function parseResponse(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearAuthSession();
    }
    const detail = data?.detail;
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((d) => d.msg || JSON.stringify(d)).join(', ')
        : data?.message || data?.error || `Request failed (${res.status})`;
    throw new ApiError(message, { status: res.status, payload: data });
  }

  return data;
}

function authHeaders(extra = {}) {
  const headers = { ...extra };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function apiGet(path) {
  const res = await fetch(`${apiConfig.baseUrl}${path}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return parseResponse(res);
}

export async function apiPostJson(path, body = {}) {
  const res = await fetch(`${apiConfig.baseUrl}${path}`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  return parseResponse(res);
}

export async function apiPatchJson(path, body = {}) {
  const res = await fetch(`${apiConfig.baseUrl}${path}`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  return parseResponse(res);
}

export async function apiDelete(path) {
  const res = await fetch(`${apiConfig.baseUrl}${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (res.status === 204) return null;
  return parseResponse(res);
}

export async function apiPostForm(path, formData) {
  const res = await fetch(`${apiConfig.baseUrl}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  return parseResponse(res);
}

// Keep old names used by earlier modules
export const postJson = (url, body) => apiPostJson(url.replace(apiConfig.baseUrl, '') || url, body);
export const postFormData = (url, formData) => apiPostForm(url.replace(apiConfig.baseUrl, '') || url, formData);
