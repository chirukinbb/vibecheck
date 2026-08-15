// src/api/auth.ts — OAuth-авторизация через Google/Facebook
import type {AuthCallbackResponse, AuthProvider, LoginCredentials, RegisterCredentials} from '../types';
import {apiClient, setAuthToken} from './client';

const DEFAULT_SERVER_URL = 'https://events.guten.website';

export function getServerBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_SERVER_URL ?? process.env.SERVER_URL ?? DEFAULT_SERVER_URL;
  return raw.replace(/\/+$/, '');
}

export async function loginWithEmail(payload: LoginCredentials): Promise<AuthCallbackResponse> {
  const {data} = await apiClient.post<AuthCallbackResponse>('/login', payload);
  setAuthToken(data.token);
  return data;
}

export async function getCurrentUser(): Promise<AuthCallbackResponse> {
  const {data} = await apiClient.get<AuthCallbackResponse>('/me');
  setAuthToken(data.token);
  return data;
}

export async function registerWithEmail(payload: RegisterCredentials): Promise<AuthCallbackResponse> {
  const {data} = await apiClient.post<AuthCallbackResponse>('/register', payload);
  setAuthToken(data.token);
  return data;
}

/** URL для редиректа пользователя на OAuth-провайдера */
export function getOAuthRedirectUrl(provider: AuthProvider): string {
  const base = getServerBaseUrl();
  return `${base}/auth/${provider}/redirect?source=app`;
}

/** URL, на который провайдер редиректит после авторизации */
export function getOAuthCallbackUrl(provider: AuthProvider): string {
  return `${getServerBaseUrl()}/auth/${provider}/callback`;
}

/**
 * Парсит JSON-ответ из колбэк-урла и сохраняет токен.
 * Вызывать, когда WebView/Custom Tab перехватил callback-url и получил тело ответа.
 */
export function handleOAuthCallback(json: AuthCallbackResponse): AuthCallbackResponse {
  setAuthToken(json.token);
  return json;
}

export function handleOAuthToken(token: string): string {
  setAuthToken(token);
  return token;
}

export async function loginWithOAuth(provider: AuthProvider): Promise<string> {
  return getOAuthRedirectUrl(provider);
}
