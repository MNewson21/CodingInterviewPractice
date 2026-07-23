import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CUSTOM_THEME_ID, DEFAULT_EDITOR_THEME } from '../features/editor/themes';

/** Whether the chosen theme recolours the whole app or only the code editor. */
export type ThemeScope = 'page' | 'editor';

/** The theme ids the store now recognises: Day, Night, or a custom colour. */
const VALID_THEMES = new Set(['vs', 'vs-dark', CUSTOM_THEME_ID]);

interface ThemeState {
  /** Monaco theme id: 'vs' (Day), 'vs-dark' (Night), or 'custom'. */
  editorTheme: string;
  /** Base colour used when `editorTheme` is 'custom'. */
  customColor: string;
  /** 'page' tints the entire UI; 'editor' limits the theme to the code editor. */
  scope: ThemeScope;
  setEditorTheme: (id: string) => void;
  setCustomColor: (hex: string) => void;
  setScope: (scope: ThemeScope) => void;
  toggleScope: () => void;
}

// Persisted to localStorage so the choice survives reloads and applies on every page.
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      editorTheme: DEFAULT_EDITOR_THEME,
      customColor: '#0d1117',
      scope: 'page',
      setEditorTheme: (editorTheme) => set({ editorTheme }),
      setCustomColor: (customColor) => set({ customColor }),
      setScope: (scope) => set({ scope }),
      toggleScope: () => set((s) => ({ scope: s.scope === 'page' ? 'editor' : 'page' })),
    }),
    {
      name: 'cip-editor-theme',
      version: 1,
      // v0 stored one of seven preset ids; the removed presets no longer exist as Monaco
      // themes or CSS ramps, so coerce any unknown id to Night to avoid a broken render.
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<ThemeState>;
        if (!state.editorTheme || !VALID_THEMES.has(state.editorTheme)) {
          state.editorTheme = DEFAULT_EDITOR_THEME;
        }
        if (!state.customColor) state.customColor = '#0d1117';
        return state as ThemeState;
      },
    },
  ),
);
