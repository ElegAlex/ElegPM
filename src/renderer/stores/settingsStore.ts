import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'fr' | 'en';
export type Theme = 'light' | 'dark';

interface SettingsState {
  language: Language;
  theme: Theme;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'fr',
      theme: 'light',
      setLanguage: (language) => {
        set({ language });
        // Apply theme class to document
        document.documentElement.setAttribute('lang', language);
      },
      setTheme: (theme) => {
        set({ theme });
        // Apply theme class to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }),
    {
      name: 'elegpm-settings',
      onRehydrateStorage: () => (state) => {
        // Apply settings on app load
        if (state) {
          document.documentElement.setAttribute('lang', state.language);
          if (state.theme === 'dark') {
            document.documentElement.classList.add('dark');
          }
        }
      },
    }
  )
);
