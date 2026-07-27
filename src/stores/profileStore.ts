// src/stores/profileStore.ts — операции с профилем
import {create} from 'zustand';
import type {ProfileUpdateDTO} from '../types';
import {updateProfile} from '../api/profile';
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
        name: dto.name,
        phone: dto.phone,
        country_phone_code: dto.country_phone_code,
        country_phone_iso: dto.country_phone_iso,
        languages: dto.languages,
        bio: dto.bio,
      });
      return res.message;
    } catch (e: any) {
      const msg = e?.message ?? 'Ошибка обновления профиля';
      set({error: msg});
      return null;
    } finally {
      set({isUpdating: false});
    }
  },
}));
