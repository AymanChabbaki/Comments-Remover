/**
 * Small shared pieces (badges, time formatting) used across the
 * Dashboard/Comments/Blacklist pages.
 */
export function relativeTime(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** Shared card chrome -- one definition so surfaces stay consistent. */
export const CARD = 'rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(31,36,44,0.04)]';

export function PlatformBadge({ platform }) {
  const isIg = platform === 'instagram';
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ${
        isIg ? 'bg-ig-soft text-ig' : 'bg-fb-soft text-fb'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {isIg ? 'Instagram' : 'Facebook'}
    </span>
  );
}

export function VerdictBadge({ event }) {
  const isError = !!event.error;
  const label = isError ? 'ERROR' : event.verdict;
  const cls = isError
    ? 'bg-warn-soft text-warn'
    : event.verdict === 'DELETE'
      ? 'bg-danger-soft text-danger'
      : 'bg-good-soft text-good';
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}
