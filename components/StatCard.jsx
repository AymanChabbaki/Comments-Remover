'use client';

import { useCountUp } from './useCountUp';
import { CARD } from './dashboardUi';

const ACCENT = {
  neutral: 'text-navy-400',
  danger: 'text-danger',
  good: 'text-good',
  warn: 'text-warn',
  brand: 'text-brand-600',
};

const RULE = {
  neutral: 'bg-navy-300',
  danger: 'bg-danger',
  good: 'bg-good',
  warn: 'bg-warn',
  brand: 'bg-brand-600',
};

/** value may be a number (animates with a count-up) or a string (renders as-is, e.g. "42%" or "3 / 1"). */
export default function StatCard({ label, value, icon: Icon, color = 'neutral', delay = 0 }) {
  const animated = useCountUp(value);

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-fade-in-up group relative overflow-hidden p-4 transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(31,36,44,0.08)] ${CARD}`}
    >
      {/* Left rule carries the metric's color -- keeps the number itself in ink. */}
      <span className={`absolute left-0 top-0 h-full w-[3px] ${RULE[color] || RULE.neutral}`} />
      <div className="flex items-start justify-between gap-2 pl-1.5">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">{label}</div>
        <Icon size={15} strokeWidth={2.25} className={`shrink-0 ${ACCENT[color] || ACCENT.neutral}`} />
      </div>
      <div className="font-display mt-2 pl-1.5 text-[28px] font-bold leading-none text-ink">{animated}</div>
    </div>
  );
}
