// src/api/client.ts — HTTP-клиент с авторизацией
import axios, {type AxiosInstance} from 'axios';

const DEFAULT_SERVER_URL = 'https://events.guten.website';
let rawBase = process.env.EXPO_PUBLIC_API_URL ?? process.env.SERVER_URL ?? DEFAULT_SERVER_URL;
if (typeof rawBase !== 'string' || rawBase.trim() === '') {
  rawBase = DEFAULT_SERVER_URL;
}
rawBase = rawBase.replace(/\/+$/, '');
const hasScheme = /^https?:\/\//i.test(rawBase);
const base = hasScheme ? rawBase : `https://${rawBase}`;
export const API_URL = base + '/api/v1';

/** Хранимый Bearer-токен (устанавливается через setAuthToken) */
let authToken: string | null = null;

export function setAuthToken(token: string): void {
  authToken = token;
}

export function clearAuthToken(): void {
  authToken = null;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
  },
});

// Подмешиваем Bearer-токен в каждый запрос.
apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});
