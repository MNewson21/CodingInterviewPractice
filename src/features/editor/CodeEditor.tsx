import Editor, { type OnMount } from '@monaco-editor/react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useKeystrokeStore } from '../../stores/useKeystrokeStore';
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

  const handleMount: OnMount = (editor) => {
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
      theme="vs-dark"
      language={MONACO_LANGUAGE[language]}
      value={code}
      onChange={(value) => setCode(value ?? '')}
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
