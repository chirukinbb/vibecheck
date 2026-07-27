// src/api/filter.ts — гео-фильтр пользователя
import {apiClient} from './client';
import type {FilterUpdateDTO, SuccessResponse} from '../types';

/** PATCH /api/v1/filter — обновить гео-фильтр */
export function updateFilter(dto: FilterUpdateDTO): Promise<SuccessResponse> {
  return apiClient.patch<SuccessResponse>('/filter', dto).then((r) => r.data);
}
