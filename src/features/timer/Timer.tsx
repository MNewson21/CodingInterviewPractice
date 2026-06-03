import { useEffect, useRef } from 'react';
import {
  useTimerStore,
  selectDisplayMs,
  type TimerMode,
} from '../../stores/useTimerStore';

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

const DURATION_PRESETS_MIN = [15, 30, 45, 60];

export function Timer() {
  const running = useTimerStore((s) => s.running);
  const mode = useTimerStore((s) => s.mode);
  const durationMs = useTimerStore((s) => s.durationMs);
  const display = useTimerStore(selectDisplayMs);
  const tick = useTimerStore((s) => s.tick);
  const toggle = useTimerStore((s) => s.toggle);
  const reset = useTimerStore((s) => s.reset);
  const setMode = useTimerStore((s) => s.setMode);
  const setDurationMs = useTimerStore((s) => s.setDurationMs);

  // Drive the clock while running, using a measured delta so pauses/tab-throttling
  // don't drift the displayed time.
  const lastRef = useRef<number | null>(null);
  useEffect(() => {
    if (!running) {
      lastRef.current = null;
      return;
    }
    lastRef.current = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const delta = now - (lastRef.current ?? now);
      lastRef.current = now;
      tick(delta);
    }, 200);
    return () => window.clearInterval(id);
  }, [running, tick]);

  const isCountdown = mode === 'countdown';
  const finished = isCountdown && display === 0;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`min-w-[68px] text-right font-mono text-lg tabular-nums ${
          finished ? 'text-red-400' : 'text-zinc-100'
        }`}
      >
        {formatMs(display)}
      </span>

      <button
        type="button"
        onClick={toggle}
        disabled={finished}
        className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? 'Pause' : 'Start'}
      </button>
      <button
        type="button"
        onClick={reset}
        className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs hover:bg-zinc-700"
      >
        Reset
      </button>

      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as TimerMode)}
        className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100"
        aria-label="Timer mode"
      >
        <option value="countup">Count up</option>
        <option value="countdown">Countdown</option>
      </select>

      {isCountdown && (
        <select
          value={durationMs}
          onChange={(e) => setDurationMs(Number(e.target.value))}
          className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100"
          aria-label="Countdown duration"
        >
          {DURATION_PRESETS_MIN.map((min) => (
            <option key={min} value={min * 60 * 1000}>
              {min} min
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
