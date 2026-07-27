// src/api/categories.ts — категории событий
import {apiClient} from './client';
import type {Category} from '../types';

/** GET /api/v1/categories — список всех категорий */
export function getCategories(): Promise<Category[]> {
  return apiClient.get<Category[]>('/categories').then((r) => r.data);
}
