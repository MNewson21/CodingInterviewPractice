/**
 * Shown while a lazily-loaded route chunk is in flight.
 *
 * Deliberately minimal: on a fast connection the chunk arrives in a frame or two,
 * and a spinner that flashes for 50ms reads as a glitch. `role="status"` means a
 * screen reader announces the wait without the visual noise, and the full-height
 * box keeps the page from collapsing and re-expanding as the chunk lands.
 */
export function RouteFallback() {
  return (
    <div className="min-h-screen bg-zinc-950" role="status" aria-live="polite">
      <span className="sr-only">Loading page…</span>
    </div>
  );
}
