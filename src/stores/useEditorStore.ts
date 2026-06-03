import { create } from 'zustand';
import type { Language } from '../types/problem';
import { ENABLED_LANGUAGES } from '../lib/languages';

interface EditorState {
  code: string;
  language: Language;
  setCode: (code: string) => void;
  setLanguage: (language: Language) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  code: '',
  language: ENABLED_LANGUAGES[0],
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
}));
