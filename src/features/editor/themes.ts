import type { Monaco } from '@monaco-editor/react';

export interface EditorThemeDef {
  /** Monaco theme id passed to <Editor theme=...>. */
  id: string;
  /** Short label shown as the button's title/tooltip. */
  label: string;
  /** Representative colour shown on the circular swatch button. */
  swatch: string;
}

export const DEFAULT_EDITOR_THEME = 'vs-dark';

type ThemeData = Parameters<Monaco['editor']['defineTheme']>[1];

// Custom themes we register on the Monaco instance. Built-in ids (vs, vs-dark,
// hc-black) need no registration and are intentionally absent here.
const CUSTOM_THEMES: Record<string, ThemeData> = {
  monokai: {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '88846f' },
      { token: 'string', foreground: 'e6db74' },
      { token: 'keyword', foreground: 'f92672' },
      { token: 'number', foreground: 'ae81ff' },
      { token: 'type', foreground: '66d9ef' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#f8f8f2',
    },
  },
  'solarized-dark': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '586e75' },
      { token: 'string', foreground: '2aa198' },
      { token: 'keyword', foreground: '859900' },
      { token: 'number', foreground: 'd33682' },
    ],
    colors: {
      'editor.background': '#002b36',
      'editor.foreground': '#839496',
    },
  },
  'github-dark': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8b949e' },
      { token: 'string', foreground: 'a5d6ff' },
      { token: 'keyword', foreground: 'ff7b72' },
      { token: 'number', foreground: '79c0ff' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#c9d1d9',
    },
  },
};

// Order shown in the switcher. Built-ins first, then our custom palettes.
export const EDITOR_THEMES: EditorThemeDef[] = [
  { id: 'vs-dark', label: 'Dark', swatch: '#1e1e1e' },
  { id: 'vs', label: 'Light', swatch: '#ffffff' },
  { id: 'hc-black', label: 'High Contrast', swatch: '#000000' },
  { id: 'monokai', label: 'Monokai', swatch: '#272822' },
  { id: 'solarized-dark', label: 'Solarized', swatch: '#002b36' },
  { id: 'github-dark', label: 'GitHub', swatch: '#0d1117' },
];

let registered = false;

/**
 * Register custom themes once per page load. Call from <Editor beforeMount> so the
 * themes exist before Monaco applies the `theme` prop (otherwise a custom id is a no-op).
 */
export function registerEditorThemes(monaco: Monaco) {
  if (registered) return;
  for (const [id, data] of Object.entries(CUSTOM_THEMES)) {
    monaco.editor.defineTheme(id, data);
  }
  registered = true;
}
