// src/api/filter.ts — гео-фильтр пользователя
import type {FilterUpdateDTO, GeoFilter} from '../types';
import {apiClient} from './client';

/** PATCH /api/v1/filter — обновить гео-фильтр */
export async function updateFilter(dto: FilterUpdateDTO): Promise<GeoFilter> {
  const res = await apiClient.patch('/filter', dto);
  return res.data.data as GeoFilter;
}