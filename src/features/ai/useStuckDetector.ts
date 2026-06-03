import { useEffect, useState } from 'react';
import { useKeystrokeStore } from '../../stores/useKeystrokeStore';

const STUCK_IDLE_MS = 20_000; // no typing for 20s => a hint unlocks

export function useStuckDetector(): { stuck: boolean } {
  const lastActivityAt = useKeystrokeStore((s) => s.lastActivityAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const stuck = lastActivityAt != null && now - lastActivityAt >= STUCK_IDLE_MS;
  return { stuck };
}
