'use client';

import { useEffect, useState } from 'react';
import { CARD } from './dashboardUi';

/**
 * Small horizontal bar-comparison chart used on the admin overview.
 * Bars animate from zero width on mount; value is always shown as text
 * (not color-alone), since a couple of the platform/status hues aren't
 * guaranteed distinguishable under color-vision deficiency.
 */
export default function BarChart({ title, rows, icon: Icon }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <section className={`p-6 ${CARD}`}>
      <div className="mb-6 flex items-center gap-2 text-headline-md text-on-surface">
        {Icon && <Icon size={18} className="text-primary" />}
        {title}
      </div>
      {rows.length === 0 ? (
        <div className="py-8 text-center text-sm text-on-surface-variant">No data yet.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium text-on-surface-variant">{r.label}</span>
                <span className="shrink-0 font-bold tabular-nums text-on-surface">{r.value}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${r.colorClass}`}
                  style={{ width: ready ? `${Math.max((r.value / max) * 100, r.value > 0 ? 4 : 0)}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
