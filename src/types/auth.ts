// src/types/auth.ts — авторизация через OAuth (Google/Facebook)

import type {Profile} from './profile';
import type {GeoFilter} from './filter';

/** OAuth-провайдер */
export type AuthProvider = 'google' | 'facebook';

/** Ответ после OAuth-авторизации (GET /api/auth/{provider}/callback) */
export interface AuthCallbackResponse {
  name: string;
  token: string; // формат Sanctum: "{id}|{plain_text_token}"
  profile: Profile;
  filter: GeoFilter;
  has_feedback: boolean;
}
