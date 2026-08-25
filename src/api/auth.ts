// src/api/auth.ts — авторизация: email+password и OAuth
import type {
    AuthProvider,
    LoginCredentials,
    LoginResponse,
    MeResponse,
    RegisterCredentials,
    SuccessResponse,
} from '../types';
import {apiClient, setAuthToken} from './client';

const DEFAULT_SERVER_URL = 'https://events.guten.website';

export function getServerBaseUrl(): string {
    const raw = process.env.EXPO_PUBLIC_SERVER_URL ?? process.env.SERVER_URL ?? DEFAULT_SERVER_URL;
    return raw.replace(/\/+$/, '');
}

/** POST /api/v1/login — вход по email+паролю. Возвращает только токен. */
export async function loginWithEmail(payload: LoginCredentials): Promise<LoginResponse> {
    const {data} = await apiClient.post<LoginResponse>('/login', payload);
    setAuthToken(data.data.token);
    return data.data;
}

/** POST /api/v1/register — регистрация. Пароль придёт на email, токен НЕ возвращается. */
export async function registerWithEmail(payload: RegisterCredentials): Promise<SuccessResponse> {
    const {data} = await apiClient.post<SuccessResponse>('/register', payload);
    return data.data;
}

/** GET /api/v1/me — данные текущего пользователя (БЕЗ обёртки data и БЕЗ токена). */
export async function getCurrentUser(): Promise<MeResponse> {
    const {data} = await apiClient.get<MeResponse>('/me');
    return data.data;
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

/** Сохранить OAuth-токен, полученный из deep link `events://auth-callback?token=...` */
export function handleOAuthToken(token: string): string {
  setAuthToken(token);
  return token;
}

/** Открыть OAuth-флоу — возвращает URL редиректа на провайдера */
export async function loginWithOAuth(provider: AuthProvider): Promise<string> {
    return getOAuthRedirectUrl(provider);
}
