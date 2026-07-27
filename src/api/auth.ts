// src/api/auth.ts — OAuth-авторизация через Google/Facebook
import {setAuthToken} from './client';
import type {AuthCallbackResponse, AuthProvider} from '../types';

const AUTH_BASE = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:8080';

/** URL для редиректа пользователя на OAuth-провайдера */
export function getOAuthRedirectUrl(provider: AuthProvider): string {
  return `${AUTH_BASE}/api/auth/${provider}/redirect`;
}

/** URL, на который провайдер редиректит после авторизации */
export function getOAuthCallbackUrl(provider: AuthProvider): string {
  return `${AUTH_BASE}/api/auth/${provider}/callback`;
}

/**
 * Парсит JSON-ответ из колбэк-урла и сохраняет токен.
 * Вызывать, когда WebView/Custom Tab перехватил callback-url и получил тело ответа.
 */
export function handleOAuthCallback(json: AuthCallbackResponse): AuthCallbackResponse {
  setAuthToken(json.token);
  return json;
}
