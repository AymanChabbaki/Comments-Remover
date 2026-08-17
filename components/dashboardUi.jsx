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
export const CARD = 'rounded-xl border border-surface-container-high bg-surface-container-lowest shadow-[0_2px_12px_rgba(0,0,0,0.03)]';

export function PlatformBadge({ platform }) {
  const isIg = platform === 'instagram';
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-label-sm ${
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
  const label = isError ? 'Error' : event.verdict === 'DELETE' ? 'Deleted' : 'Kept';
  const cls = isError
    ? 'bg-secondary-container text-on-secondary-container'
    : event.verdict === 'DELETE'
      ? 'bg-primary/10 text-primary'
      : 'bg-good-soft text-good';
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-label-sm font-medium ${cls}`}>
      {label}
    </span>
  );
}
