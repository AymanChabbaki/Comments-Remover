'use client';

import { AlertTriangle } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  return (
    <div className="bg-grain flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="max-w-sm rounded-xl border border-line bg-surface p-8 text-center shadow-[0_1px_2px_rgba(31,36,44,0.04)]">
        <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-warn-soft">
          <AlertTriangle size={20} className="text-warn" strokeWidth={2.25} />
        </span>
        <h1 className="font-display text-lg font-bold text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="mt-6 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 active:scale-[0.98]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
