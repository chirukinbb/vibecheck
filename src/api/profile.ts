// src/api/profile.ts — профиль пользователя
import {apiClient} from './client';
import type {ProfileUpdateDTO, SuccessResponse} from '../types';

/** PATCH /api/v1/profile — обновить профиль */
export function updateProfile(dto: ProfileUpdateDTO): Promise<SuccessResponse> {
  return apiClient.patch<SuccessResponse>('/profile', dto).then((r) => r.data);
}
