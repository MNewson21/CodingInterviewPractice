import { useState } from 'react';
import { deleteAccount } from '../../lib/auth';

/**
 * "Danger zone" control letting a signed-in user permanently delete their account and
 * all their data (UK GDPR right to erasure). Because this is irreversible, the user must
 * type their own email to arm the delete button. On success the Edge Function deletes the
 * auth user (cascading to sessions + custom problems) and signs them out; we reload so the
 * app returns to the signed-out landing view.
 */
export function DeleteAccount({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const armed = confirmText.trim().toLowerCase() === email.trim().toLowerCase();

  async function handleDelete() {
    if (!armed) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount();
      // Session is gone; reload to clear all in-memory state and show the landing page.
      window.location.assign('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-lg border border-red-900/60 bg-red-950/20 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-red-300">Delete my account</h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            Permanently removes your email, sessions, and custom problems. This cannot be undone.
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded border border-red-800 px-3 py-1.5 text-xs text-red-300 hover:bg-red-900/40"
          >
            Delete account
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 border-t border-red-900/50 pt-3">
          <label className="block text-xs text-zinc-400">
            Type your email <span className="font-mono text-zinc-300">{email}</span> to confirm:
            <input
              type="email"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-red-600"
              placeholder={email}
            />
          </label>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!armed || deleting}
              className="rounded bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deleting ? 'Deleting…' : 'Permanently delete my account'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmText('');
                setError(null);
              }}
              disabled={deleting}
              className="text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
