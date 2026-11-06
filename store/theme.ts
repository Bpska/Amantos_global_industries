import { create } from 'zustand';
import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_KEY = 'retailflow.theme';

const getInitialTheme = (): ThemeMode => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {
      // ignore
    }
  }
  // Default to crisp White theme
  return 'light';
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (e) {
        // ignore
      }
    }
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {
        // ignore
      }
    }
    set({ theme: next });
  },
}));

