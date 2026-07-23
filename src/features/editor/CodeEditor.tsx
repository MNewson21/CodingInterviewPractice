import Editor, { type BeforeMount, type Monaco, type OnMount } from '@monaco-editor/react';
import { useEffect, useRef } from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useKeystrokeStore } from '../../stores/useKeystrokeStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { CUSTOM_THEME_ID, defineCustomEditorTheme } from './themes';
import { registerCompletions } from './completions';
import { changesToEvents } from '../keystrokes/recorder';
import type { Language } from '../../types/problem';

const MONACO_LANGUAGE: Record<Language, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
};

export function CodeEditor() {
  const code = useEditorStore((s) => s.code);
  const language = useEditorStore((s) => s.language);
  const setCode = useEditorStore((s) => s.setCode);
  const editorTheme = useThemeStore((s) => s.editorTheme);
  const customColor = useThemeStore((s) => s.customColor);
  const monacoRef = useRef<Monaco | null>(null);

  // Define the custom theme (if selected) + curated completions before Monaco renders.
  const handleBeforeMount: BeforeMount = (monaco) => {
    if (editorTheme === CUSTOM_THEME_ID) defineCustomEditorTheme(monaco, customColor);
    registerCompletions(monaco);
  };

  // Repaint the editor live when the custom colour changes while mounted.
  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco || editorTheme !== CUSTOM_THEME_ID) return;
    defineCustomEditorTheme(monaco, customColor);
    monaco.editor.setTheme(CUSTOM_THEME_ID);
  }, [editorTheme, customColor]);

  const handleMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco;
    editor.onDidChangeModelContent((e) => {
      // Ignore programmatic full replacements (starter-code seeding, replay).
      if (e.isFlush) return;

      const ks = useKeystrokeStore.getState();
      if (!ks.recording) return;

      // Anchor the timeline to the first real keystroke so replay starts immediately.
      let startTime = ks.startTime;
      if (startTime == null) {
        startTime = Date.now();
        ks.setStartTime(startTime);
      }
      ks.appendEvents(changesToEvents(e.changes, startTime));
    });
  };

  return (
    <Editor
      height="100%"
      theme={editorTheme}
      language={MONACO_LANGUAGE[language]}
      value={code}
      onChange={(value) => setCode(value ?? '')}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
      }}
    />
  );
}
