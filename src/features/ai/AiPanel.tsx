import { Link } from 'react-router-dom';
import { HintPanel } from './HintPanel';
import { ReviewPanel } from './ReviewPanel';
import type { Problem } from '../../types/problem';
import { useAuth } from '../../lib/auth';

export function AiPanel({ problem }: { problem: Problem }) {
  const { user } = useAuth();

  // Guests can't use AI (it needs an account + backend), so prompt to sign in rather
  // than render panels that would error.
  if (!user) {
    return (
      <div className="border-t border-zinc-800 p-5 text-sm text-zinc-400">
        <p className="font-medium text-zinc-300">AI interview review</p>
        <p className="mt-1">
          <Link to="/auth" className="text-blue-400 hover:underline">
            Sign in
          </Link>{' '}
          to get AI hints and a review of your solution.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 border-t border-zinc-800 p-5">
      <HintPanel problem={problem} />
      <ReviewPanel problem={problem} />
    </div>
  );
}
