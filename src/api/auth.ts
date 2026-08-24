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

export async function getCurrentUser(): Promise<T> {
  console.log('=== GET /me START ===');
  console.log('api base URL:', apiClient.defaults.baseURL);
  console.log('request headers before /me:', apiClient.defaults.headers);
  console.log('auth token exists:', !!(apiClient.defaults.headers as any)?.Authorization);

  try {
    const response = await apiClient.get<AuthCallbackResponse>('/me');
    console.log('=== GET /me SUCCESS ===');
    console.log('status:', response.status);
    console.log('url:', response.config.url);
    console.log('headers:', response.config.headers);
    console.log('response data:', response.data);
    const data = response.data.data;
    console.log('user data:', data)
    setAuthToken(data.token);
    return data;
  } catch (error: any) {
    console.log('=== GET /me ERROR ===');
    console.log('error name:', error?.name);
    console.log('error message:', error?.message);
    console.log('error code:', error?.code);
    console.log('error status:', error?.response?.status);
    console.log('error url:', error?.config?.url);
    console.log('error headers:', error?.config?.headers);
    console.log('error response data:', error?.response?.data);
    console.log('error stack:', error?.stack);
    throw error;
  }
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
