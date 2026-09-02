// src/stores/categoriesStore.ts — категории (статический справочник)
import {getTags} from "@/api/tags";
import {Tag} from "@/types";
import {create} from 'zustand';

interface TagsStore {
  categories: Tag[];
  isLoading: boolean;
  error: string | null;

  fetchTags: () => Promise<void>;
}

export const useTagsStore = create<TagsStore>((set) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchTags: async () => {
    set({isLoading: true, error: null});
    try {
      const data = await getTags();
      set({categories: data});
    } catch (e: any) {
      set({error: e?.message ?? 'Ошибка загрузки категорий'});
    } finally {
      set({isLoading: false});
    }
  },
}));
