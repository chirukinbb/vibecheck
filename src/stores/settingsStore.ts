// src/stores/settingsStore.ts — локальные настройки приложения
import {create} from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  themeMode: 'system',
  setThemeMode: (themeMode) => set({themeMode}),
}));
