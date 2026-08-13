/**
 * Small shared pieces (badges, time formatting) used across the
 * Dashboard/Comments/Blacklist pages -- split out of what used to be one
 * monolithic ModerationDashboard component so each page can pull in only
 * what it needs.
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

export function PlatformBadge({ platform }) {
  if (platform === 'instagram') {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-semibold text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-400">
        <span className="h-1.5 w-1.5 rounded-full bg-current" /> Instagram
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
      <span className="h-1.5 w-1.5 rounded-full bg-current" /> Facebook
    </span>
  );
}

export function VerdictBadge({ event }) {
  const isError = !!event.error;
  const label = isError ? 'ERROR' : event.verdict;
  const cls = isError
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
    : event.verdict === 'DELETE'
      ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide ${cls}`}>
      {label}
    </span>
  );
}
