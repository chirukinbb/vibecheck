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
      const msg = e?.message ?? 'Ошибка обновления профиля';
      set({error: msg});
      return null;
    } finally {
      set({isUpdating: false});
    }
  },
}));
