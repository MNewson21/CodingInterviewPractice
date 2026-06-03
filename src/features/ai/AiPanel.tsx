import { HintPanel } from './HintPanel';
import { ReviewPanel } from './ReviewPanel';
import type { Problem } from '../../types/problem';

export function AiPanel({ problem }: { problem: Problem }) {
  return (
    <div className="space-y-6 border-t border-zinc-800 p-5">
      <HintPanel problem={problem} />
      <ReviewPanel problem={problem} />
    </div>
  );
}
