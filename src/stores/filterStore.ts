// src/stores/filterStore.ts — гео-фильтр
import {create} from 'zustand';
import {updateFilter} from '../api/filter';
import type {FilterUpdateDTO} from '../types';
import {useAuthStore} from './authStore';

interface FilterState {
  isUpdating: boolean;
  error: string | null;

  saveFilter: (dto: FilterUpdateDTO) => Promise<string | null>;
}

export const useFilterStore = create<FilterState>((set) => ({
  isUpdating: false,
  error: null,

  saveFilter: async (dto) => {
    set({isUpdating: true, error: null});
    try {
      const res = await updateFilter(dto);
      console.log('Filter updated:', res);
      // Синхронизируем с authStore — фильтр обновлён на сервере,
      useAuthStore.getState().setFilter({
        center: res.center ?? null,
        radius: res.radius,
        categories: res.categories,
      });
      return 'Фильтр обновлён';
    } catch (e: any) {
      const responseMessage = e?.response?.data?.message;
      const validationErrors = e?.response?.data?.errors;
      const firstValidationError = typeof validationErrors === 'object'
          ? Object.values(validationErrors as Record<string, unknown>)
              .flatMap((value) => Array.isArray(value) ? value : [value])
              .find((value): value is string => typeof value === 'string')
          : undefined;

      const msg = firstValidationError ?? responseMessage ?? e?.message ?? 'Ошибка обновления фильтра';
      set({error: msg});
      throw new Error(msg);
    } finally {
      set({isUpdating: false});
    }
  },
}));
