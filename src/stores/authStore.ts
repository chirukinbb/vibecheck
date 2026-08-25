// src/stores/authStore.ts — авторизация: токен, профиль, фильтр
import {create} from 'zustand';
import {getCurrentUser} from '@/api';
import {clearAuthToken as clearClientToken, setAuthToken} from '../api/client';
import type {GeoFilter, Profile} from '../types';

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
  /** Принять токен из deep link OAuth callback / login и загрузить данные по /me */
  loginWithToken: (token: string) => Promise<void>;

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

  loginWithToken: async (token) => {
    setAuthToken(token);
    set({isLoading: true});

    try {
      const user = await getCurrentUser();
      // /me НЕ возвращает токен — сохраняем переданный из URL
      set({
        token,
        name: user.name,
        profile: user.profile,
        filter: user.filter,
        hasFeedback: user.has_feedback,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      clearClientToken();
      set({
        token: null,
        name: null,
        profile: null,
        filter: null,
        hasFeedback: false,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
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
