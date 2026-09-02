// src/api/categories.ts — категории событий
import type {Tag} from '../types';
import {apiClient} from './client';

/** GET /api/v1/tags — список всех тегов */
export async function getTags(): Promise<Tag[]> {
  const res = await apiClient.get('/tags');
  const raw = res.data as any;
  return (raw.data ?? raw) as Tag[];
}
