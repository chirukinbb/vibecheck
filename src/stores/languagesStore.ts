import {create} from 'zustand';
import {getLanguages} from '../api/languages';

interface LanguagesState {
  languages: Record<string, string>;
  isLoading: boolean;
  error: string | null;

  fetchLanguages: () => Promise<void>;
}

export const useLanguagesStore = create<LanguagesState>((set) => ({
  languages: {},
  isLoading: false,
  error: null,

  fetchLanguages: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getLanguages();
      set({ languages: data });
    } catch (e: any) {
      set({ error: e?.message ?? 'Ошибка загрузки языков' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
