// src/stores/categoriesStore.ts — категории (статический справочник)
import {create} from 'zustand';
import type {Category} from '../types';
import {getCategories} from '../api/categories';

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  fetchCategories: () => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({isLoading: true, error: null});
    try {
      const data = await getCategories();
      set({categories: data.data});
    } catch (e: any) {
      set({error: e?.message ?? 'Ошибка загрузки категорий'});
    } finally {
      set({isLoading: false});
    }
  },
}));
