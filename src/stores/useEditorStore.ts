import { create } from 'zustand';
import type { Language } from '../types/problem';

interface EditorState {
  code: string;
  language: Language;
  setCode: (code: string) => void;
  setLanguage: (language: Language) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  code: '',
  language: 'javascript',
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
}));
