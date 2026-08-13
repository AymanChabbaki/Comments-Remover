'use client';

import { useEffect, useState } from 'react';

/**
 * Small horizontal bar-comparison chart -- one axis, direct value labels on
 * every row (never color-alone, since a couple of the reused status/
 * platform hues sit below the ideal CVD separation floor; a visible label
 * next to each bar is the mitigation). Bars animate in from 0 width on
 * mount for a bit of motion, matching the rest of the dashboard.
 */
export default function BarChart({ title, rows, icon: Icon }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="animate-fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
        {Icon && <Icon size={15} className="text-brand-600 dark:text-brand-400" />}
        {title}
      </div>
      {rows.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">No data yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">{r.label}</span>
                <span className="tabular-nums text-slate-500 dark:text-slate-400">{r.value}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${r.colorClass}`}
                  style={{ width: ready ? `${Math.max((r.value / max) * 100, r.value > 0 ? 4 : 0)}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
