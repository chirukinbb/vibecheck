// src/api/categories.ts — категории событий
import {apiClient} from './client';
import type {Tag} from '../types';

/** GET /api/v1/categories — список всех категорий */
export function getTags(): Promise<Tag[]> {
  return apiClient.get<Tag[]>('/tags').then((r) => r.data);
}
