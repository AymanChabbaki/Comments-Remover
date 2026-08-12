'use client';

export default function GlobalError({ error, reset }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center dark:bg-slate-950">
      <div>
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
