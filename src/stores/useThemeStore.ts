import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_EDITOR_THEME } from '../features/editor/themes';

/** Whether the chosen theme recolours the whole app or only the code editor. */
export type ThemeScope = 'page' | 'editor';

interface ThemeState {
  /** Monaco editor theme id (built-in or one of our custom ids). */
  editorTheme: string;
  /** 'page' tints the entire UI; 'editor' limits the theme to the code editor. */
  scope: ThemeScope;
  setEditorTheme: (id: string) => void;
  setScope: (scope: ThemeScope) => void;
  toggleScope: () => void;
}

// Persisted to localStorage so the choice survives reloads and applies on every page.
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      editorTheme: DEFAULT_EDITOR_THEME,
      scope: 'page',
      setEditorTheme: (editorTheme) => set({ editorTheme }),
      setScope: (scope) => set({ scope }),
      toggleScope: () => set((s) => ({ scope: s.scope === 'page' ? 'editor' : 'page' })),
    }),
    { name: 'cip-editor-theme' },
  ),
);
