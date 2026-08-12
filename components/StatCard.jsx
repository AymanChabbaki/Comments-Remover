'use client';

import { useCountUp } from './useCountUp';

const STYLES = {
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  red: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
};

/** value may be a number (animates with a count-up) or a string (renders as-is, e.g. "42%" or "3 / 1"). */
export default function StatCard({ label, value, icon: Icon, color = 'slate', delay = 0 }) {
  const animated = useCountUp(value);

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="animate-fade-in-up group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/20"
    >
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${STYLES[color]}`}>
        <Icon size={18} strokeWidth={2.25} />
      </div>
      <div className="font-display text-2xl font-bold tracking-tight">{animated}</div>
      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}
