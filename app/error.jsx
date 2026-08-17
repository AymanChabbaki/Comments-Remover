'use client';

import { AlertTriangle } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-sm rounded-xl border border-surface-container-high bg-surface-container-lowest p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-secondary-container">
          <AlertTriangle size={20} className="text-secondary" strokeWidth={2.25} />
        </span>
        <h1 className="font-display text-lg font-bold text-on-surface">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-container active:scale-[0.98]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
