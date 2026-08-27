// src/types/auth.ts — авторизация (email+password и OAuth)

import type {GeoFilter} from './filter';
import type {Profile} from './profile';

/** OAuth-провайдер */
export type AuthProvider = 'google' | 'facebook';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
}

/** Ответ POST /api/v1/login — только токен (Sanctum: "{id}|{plain_text_token}") */
export interface LoginResponse {
  token: string;
}

/** Ответ GET /api/v1/me — данные текущего пользователя (БЕЗ токена и БЕЗ обёртки data) */
export interface MeResponse {
  name: string;
  profile: Profile;
  filter: GeoFilter;
}
