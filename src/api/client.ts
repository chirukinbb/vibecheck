// src/api/client.ts — HTTP-клиент с авторизацией
import axios, {type AxiosInstance} from 'axios';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';

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
