// src/api/profile.ts — профиль пользователя
import {apiClient} from './client';
import type {ProfileUpdateDTO, SuccessResponse} from '../types';

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
    // 2. Получаем расширение файла из URI
    const filename = data.avatar_url.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : 'image/jpeg';

    // 3. Формируем объект файла для DTO
    const avatarFile = {
      uri: data.avatar_url,             // Локальный путь пути file://...
      name: filename,        // Имя файла (например, avatar.jpg или avatar.webp)
      type: type,            // MIME-тип (например, image/webp или image/jpeg)
    };
    formData.append('avatar', avatarFile as any);
  } else if (data.avatar_url !== undefined) {
    // Если передаем ссылку или null
    formData.append('avatar_url', data.avatar_url ?? '');
  }

  console.log('formData:', formData)

  return formData;
};

/** PATCH /api/v1/profile — обновить профиль */
export function updateProfile(dto: ProfileUpdateDTO): Promise<SuccessResponse> {
  return apiClient.patch<SuccessResponse>('/profile', createProfileFormData(dto), {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then((r) => r.data);
}
