import Editor from '@monaco-editor/react';
import { useEditorStore } from '../../stores/useEditorStore';
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

  return (
    <Editor
      height="100%"
      theme="vs-dark"
      language={MONACO_LANGUAGE[language]}
      value={code}
      onChange={(value) => setCode(value ?? '')}
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
