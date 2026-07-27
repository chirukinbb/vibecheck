// src/stores/authStore.ts — авторизация: токен, профиль, фильтр
import {create} from 'zustand';
import type {AuthCallbackResponse, GeoFilter, Profile} from '../types';
import {clearAuthToken as clearClientToken, setAuthToken} from '../api/client';

interface AuthState {
  // ─── Данные ───
  token: string | null;
  name: string | null;
  profile: Profile | null;
  filter: GeoFilter | null;
  hasFeedback: boolean;

  // ─── Состояние ───
  isAuthenticated: boolean;
  isLoading: boolean;

  // ─── Действия ───
  /** Принять ответ OAuth-колбэка и сохранить всё */
  login: (data: AuthCallbackResponse) => void;

  /** Выход: сбросить токен и состояние */
  logout: () => void;

  /** Обновить профиль локально */
  setProfile: (p: Profile) => void;

  /** Обновить фильтр локально */
  setFilter: (f: GeoFilter) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  name: null,
  profile: null,
  filter: null,
  hasFeedback: false,
  isAuthenticated: false,
  isLoading: false,

  login: (data) => {
    setAuthToken(data.token);
    set({
      token: data.token,
      name: data.name,
      profile: data.profile,
      filter: data.filter,
      hasFeedback: data.has_feedback,
      isAuthenticated: true,
    });
  },

  logout: () => {
    clearClientToken();
    set({
      token: null,
      name: null,
      profile: null,
      filter: null,
      hasFeedback: false,
      isAuthenticated: false,
    });
  },

  setProfile: (p) => set({profile: p}),
  setFilter: (f) => set({filter: f}),
}));
