import { useEffect, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { KeystrokeEvent } from '../../types/session';

type EditorInstance = Parameters<OnMount>[0];
type MonacoInstance = Parameters<OnMount>[1];

const SPEEDS = [1, 2, 4, 8];

function formatMs(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ReplayPlayer({
  events,
  language,
  initialCode = '',
}: {
  events: KeystrokeEvent[];
  language: string;
  /** Buffer content at the moment recording started (the seeded starter code). */
  initialCode?: string;
}) {
  const editorRef = useRef<EditorInstance | null>(null);
  const monacoRef = useRef<MonacoInstance | null>(null);
  const appliedRef = useRef(0); // how many events are currently applied to the model
  const lastTimeRef = useRef(0); // last playhead time we applied (to detect rewind)

  const totalMs = events.length ? events[events.length - 1].t : 0;
  const [currentMs, setCurrentMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    // Start from the starter code, not an empty buffer, so the function lines show
    // and the recorded edit positions line up.
    editor.getModel()?.setValue(initialCode);
  };

  // Apply edits to match the current playhead position.
  useEffect(() => {
    const model = editorRef.current?.getModel();
    const monaco = monacoRef.current;
    if (!model || !monaco) return;

    // Rewound (scrub backward / restart): rebuild from the starter code.
    if (currentMs < lastTimeRef.current) {
      model.setValue(initialCode);
      appliedRef.current = 0;
    }

    // Apply every event whose timestamp has been reached.
    while (appliedRef.current < events.length && events[appliedRef.current].t <= currentMs) {
      const ev = events[appliedRef.current];
      const range = new monaco.Range(
        ev.range.startLine,
        ev.range.startCol,
        ev.range.endLine,
        ev.range.endCol,
      );
      model.applyEdits([{ range, text: ev.text, forceMoveMarkers: true }]);
      appliedRef.current += 1;
    }

    lastTimeRef.current = currentMs;
  }, [currentMs, events, initialCode]);

  // Drive the playhead while playing.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const delta = (now - last) * speed;
      last = now;
      setCurrentMs((prev) => Math.min(prev + delta, totalMs));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, totalMs]);

  // Stop at the end.
  useEffect(() => {
    if (playing && currentMs >= totalMs) setPlaying(false);
  }, [playing, currentMs, totalMs]);

  function togglePlay() {
    if (currentMs >= totalMs) setCurrentMs(0); // restart if at the end
    setPlaying((p) => !p);
  }

  if (events.length === 0) {
    return (
      <p className="p-4 text-sm text-zinc-500">
        No keystrokes were recorded for this session.
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          theme="vs-dark"
          defaultValue={initialCode}
          language={language}
          onMount={handleMount}
          options={{
            readOnly: true,
            domReadOnly: true,
            fontSize: 14,
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>

      <div className="flex items-center gap-3 border-t border-zinc-800 px-4 py-2">
        <button
          type="button"
          onClick={togglePlay}
          className="rounded bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-500"
        >
          {playing ? 'Pause' : currentMs >= totalMs ? 'Replay' : 'Play'}
        </button>

        <input
          type="range"
          min={0}
          max={totalMs}
          value={currentMs}
          onChange={(e) => {
            setPlaying(false);
            setCurrentMs(Number(e.target.value));
          }}
          className="flex-1 accent-emerald-500"
          aria-label="Replay position"
        />

        <span className="w-20 text-right font-mono text-xs tabular-nums text-zinc-400">
          {formatMs(currentMs)} / {formatMs(totalMs)}
        </span>

        <div className="flex items-center gap-1">
          {SPEEDS.map((sp) => (
            <button
              key={sp}
              type="button"
              onClick={() => setSpeed(sp)}
              className={`rounded px-2 py-1 text-xs ${
                speed === sp
                  ? 'bg-zinc-200 text-zinc-900'
                  : 'border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {sp}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
