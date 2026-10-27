// src/stores/authStore.ts — авторизация: токен, профиль, фильтр
import {getCurrentUser} from '@/api';
import * as SecureStore from 'expo-secure-store';
import {create} from 'zustand';
import {clearAuthToken as clearClientToken, setAuthToken} from '../api/client';
import type {GeoFilter, Profile} from '../types';

interface AuthState {
  // ─── Данные ───
  id: number | null;
  token: string | null;
  name: string | null;
  profile: Profile | null;
  filter: GeoFilter | null;

  /** Инициализировать состояние из сохранённого токена и данных профиля */
  hydrateFromStorage: () => Promise<void>;

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

export const useAuthStore = create<AuthState>((set, get) => ({
  id: null,
  token: null,
  name: null,
  profile: null,
  filter: null,
  isAuthenticated: false,
  isLoading: false,

  hydrateFromStorage: async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('auth_token');
      const storedProfile = await SecureStore.getItemAsync('user_profile');

      if (!storedToken) {
        set({
          id: null,
          token: null,
          name: null,
          profile: null,
          filter: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      setAuthToken(storedToken);

      if (storedProfile) {
        try {
          const parsedProfile = JSON.parse(storedProfile) as Profile;
          set({
            profile: parsedProfile,
            token: storedToken,
            isAuthenticated: true,
          });
        } catch {
          // ignore invalid profile payload
        }
      }

      try {
        const user = await getCurrentUser();
        set({
          id: user.id ?? null,
          token: storedToken,
          name: user.name,
          profile: user.profile ?? get().profile,
          filter: user.filter ?? get().filter,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        set({
          id: null,
          token: null,
          name: null,
          profile: null,
          filter: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch {
      set({
        id: null,
        token: null,
        name: null,
        profile: null,
        filter: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  loginWithToken: async (token) => {
    setAuthToken(token);
    set({isLoading: true});

    try {
      const user = await getCurrentUser();
      // /me НЕ возвращает токен — сохраняем переданный из URL
      set({
        id: user.id ?? null,
        token,
        name: user.name,
        profile: user.profile,
        filter: user.filter,
        isAuthenticated: true,
        isLoading: false,
      });
      try {
        await SecureStore.setItemAsync('auth_token', token);
        if (user.profile) {
          await SecureStore.setItemAsync('user_profile', JSON.stringify(user.profile));
        }
      } catch {
        // ignore SecureStore errors — app still works in-memory
      }
    } catch (error) {
      clearClientToken();
      set({
        id: null,
        token: null,
        name: null,
        profile: null,
        filter: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    clearClientToken();
    set({
      id: null,
      token: null,
      name: null,
      profile: null,
      filter: null,
      isAuthenticated: false,
    });
    void (async () => {
      try {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('user_profile');
      } catch {
        // ignore
      }
    })();
  },

  setProfile: (p) => set({profile: p}),
  setFilter: (f) => set({filter: f}),
}));
