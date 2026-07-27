// src/api/client.ts — HTTP-клиент с авторизацией
import axios, {type AxiosInstance} from 'axios';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
  },
});

// Подмешиваем Bearer-токен в каждый запрос.
// Токен читается напрямую из authStore (Zustand) — всегда актуален.
apiClient.interceptors.request.use((config) => {
  // Ленивый импорт во избежание циклической зависимости
  try {
    const {useAuthStore} = require('../stores/authStore');
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // store ещё не инициализирован — запрос без токена
  }
  return config;
});
