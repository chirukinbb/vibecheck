// src/api/profile.ts — профиль пользователя
import {fileToFormData} from "@/constants/mock-data";
import type {Profile, ProfileUpdateDTO} from '../types';
import {apiClient} from './client';

// Хелпер для создания объекта FormData из вашей DTO
export const createProfileFormData = (data: ProfileUpdateDTO): FormData => {
  const formData = new FormData();

  // Добавляем обычные текстовые и массивные поля
  formData.append('name', data.name);
  formData.append('bio', data.bio);

  // Массивы в FormData обычно передаются добавлением каждого элемента (или через JSON)
  data.languages.forEach((lang) => {
    formData.append('languages[]', lang);
  });

  // Если был передан аватар-файл (объект с uri):
  if (data.avatar_url && !data.avatar_url.startsWith('https://')) {
    const avatarFile = fileToFormData(data.avatar_url)
    formData.append('avatar', avatarFile as any);
  } else if (data.avatar_url !== undefined) {
    // Если передаем ссылку или null
    formData.append('avatar_url', data.avatar_url ?? '');
  }

  console.log('formData:', formData)

  return formData;
};

/** PATCH /api/v1/profile — обновить профиль */
export function updateProfile(dto: ProfileUpdateDTO): Promise<Profile> {
  return apiClient.patch<Profile>('/profile', createProfileFormData(dto), {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then((r) => r.data);
}
