'use client';

import { useCountUp } from './useCountUp';
import { CARD } from './dashboardUi';

const ACCENT = {
  neutral: 'text-on-surface-variant',
  danger: 'text-error',
  good: 'text-good',
  warn: 'text-secondary',
  brand: 'text-primary',
};

const WATERMARK = {
  neutral: 'text-on-surface-variant',
  danger: 'text-error',
  good: 'text-good',
  warn: 'text-secondary',
  brand: 'text-primary',
};

/**
 * value may be a number (animates with a count-up) or a string (renders
 * as-is, e.g. "42%" or "3 / 1"). `note` is a small trailing context label
 * (e.g. "of 128 total") -- unlike the reference mockup, there's no
 * fabricated trend percentage here since we don't compute period-over-
 * period deltas.
 */
export default function StatCard({ label, value, icon: Icon, color = 'neutral', delay = 0, note }) {
  const animated = useCountUp(value);

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-fade-in-up group relative flex flex-col overflow-hidden p-lg transition-shadow duration-200 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] ${CARD}`}
    >
      <Icon size={96} strokeWidth={1.5} className={`pointer-events-none absolute -bottom-4 -right-4 opacity-[0.04] ${WATERMARK[color] || WATERMARK.neutral}`} />

      <div className="relative z-10 mb-4 flex items-start justify-between">
        <span className="font-mono text-label-sm uppercase text-on-surface-variant">{label}</span>
        <Icon size={20} strokeWidth={2} className={ACCENT[color] || ACCENT.neutral} />
      </div>

      <div className="relative z-10 flex items-end gap-2">
        <span className="text-[34px] font-bold leading-none tracking-tight text-on-surface">{animated}</span>
        {note && <span className="mb-0.5 text-body-md text-sm font-medium text-on-surface-variant">{note}</span>}
      </div>
    </div>
  );
}
