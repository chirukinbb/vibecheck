// src/types/auth.ts — авторизация через OAuth (Google/Facebook)

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

/** Ответ после OAuth-авторизации (GET /api/auth/{provider}/callback) */
export interface AuthCallbackResponse {
  name: string;
  token: string; // формат Sanctum: "{id}|{plain_text_token}"
  profile: Profile;
  filter: GeoFilter;
  has_feedback: boolean;
}
