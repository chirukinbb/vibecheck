// src/stores/profileStore.ts — операции с профилем
import {create} from 'zustand';
import {updateProfile} from '../api/profile';
import type {ProfileUpdateDTO} from '../types';
import {useAuthStore} from './authStore';

interface ProfileState {
  isUpdating: boolean;
  error: string | null;

  /** Обновить профиль на сервере + локально в authStore */
  saveProfile: (dto: ProfileUpdateDTO) => Promise<string | null>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  isUpdating: false,
  error: null,

  saveProfile: async (dto) => {
    set({isUpdating: true, error: null});
    try {
      const res = await updateProfile(dto);
      // Синхронизируем с authStore
      useAuthStore.getState().setProfile({
        name: res.name,
        avatar_url: res.avatar_url ?? null,
        languages: res.languages,
        bio: res.bio,
      });
      return 'Профиль обновлён';
    } catch (e: any) {
      const responseMessage = e?.response?.data?.message;
      const validationErrors = e?.response?.data?.errors;
      const firstValidationError = typeof validationErrors === 'object'
          ? Object.values(validationErrors as Record<string, unknown>)
              .flatMap((value) => Array.isArray(value) ? value : [value])
              .find((value): value is string => typeof value === 'string')
          : undefined;

      const msg = firstValidationError ?? responseMessage ?? e?.message ?? 'Ошибка обновления профиля';
      set({error: msg});
      throw new Error(msg);
    } finally {
      set({isUpdating: false});
    }
  },
}));
