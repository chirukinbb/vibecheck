// src/api/categories.ts — категории событий
import type {Category} from '../types';
import {apiClient} from './client';

/** GET /api/v1/categories — список всех категорий */
export async function getCategories(): Promise<Category[]> {
  const res = await apiClient.get('/categories');
  const raw = res.data as any;
  return (raw.data ?? raw) as Category[];
}
