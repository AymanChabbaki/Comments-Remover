'use client';

import { useEffect, useState } from 'react';
import { CARD } from './dashboardUi';

/**
 * Small horizontal bar-comparison chart -- one axis, a direct value label
 * on every row. The labels aren't decoration: the ochre in the shared
 * chart palette sits just under 3:1 against the paper surface, and a
 * visible number is the required relief. Bars animate from zero width on
 * mount.
 */
export default function BarChart({ title, rows, icon: Icon }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className={`animate-fade-in-up p-5 ${CARD}`}>
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
        {Icon && <Icon size={15} className="text-brand-600" />}
        {title}
      </div>
      {rows.length === 0 ? (
        <div className="py-8 text-center text-xs text-ink-mute">No data yet.</div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate font-medium text-ink-soft">{r.label}</span>
                <span className="font-display shrink-0 font-bold tabular-nums text-ink">{r.value}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-alt">
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
