import { useRef, useState } from 'react';
import { parseProblemData } from './problemFile';
import { saveUserProblem } from './userProblems.api';
import { useProblemsStore } from '../../stores/useProblemsStore';

export function ImportDropzone() {
  const addCustom = useProblemsStore((s) => s.addCustom);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      let added = 0;
      for (const file of Array.from(files)) {
        const text = await file.text();
        const data = parseProblemData(text); // validates; throws on bad input
        const saved = await saveUserProblem(data);
        addCustom(saved);
        added += 1;
      }
      setMsg(`Imported ${added} problem${added > 1 ? 's' : ''}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center text-sm transition-colors ${
          dragOver ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400'
        }`}
      >
        {busy ? 'Importing…' : 'Drag & drop a problem .json here, or click to choose a file'}
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>
      {msg && <p className="mt-2 text-xs text-emerald-400">{msg}</p>}
      {error && <p className="mt-2 text-xs text-red-400">Import failed: {error}</p>}
    </div>
  );
}
