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

/** Хранимый Bearer-токен */
let authToken: string | null = null;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
  },
});

export function setAuthToken(token: string): void {
  authToken = token;
}

export function clearAuthToken(): void {
  authToken = null;
  // Удаляем заголовок из Axios по умолчанию
  delete apiClient.defaults.headers.common['Authorization'];
}

// Подмешиваем Bearer-токен в каждый запрос
apiClient.interceptors.request.use((config) => {
  // Garantiruem, chto headers sushestvuyut
  config.headers = config.headers ?? {};

  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  console.log('=== AXIOS REQUEST ===');
  console.log('url:', `${config.baseURL ?? ''}${config.url ?? ''}`);
  console.log('method:', config.method?.toUpperCase());
  console.log('headers:', config.headers);
  console.log('authToken exists:', Boolean(authToken));

  return config;
});

apiClient.interceptors.response.use(
    (response) => {
      console.log('=== AXIOS RESPONSE ===');
      console.log('status:', response.status);
      console.log('url:', response.config.url);
      console.log('data:', response.data);
      return response;
    },
    (error) => {
      console.log('=== AXIOS ERROR ===');
      console.log('status:', error?.response?.status);
      console.log('url:', error?.config?.url);
      console.log('method:', error?.config?.method?.toUpperCase());
      console.log('headers:', error?.config?.headers);
      console.log('response data:', error?.response?.data);
      console.log('message:', error?.message);
      return Promise.reject(error);
    },
);