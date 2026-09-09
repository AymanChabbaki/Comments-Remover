'use client';

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

/**
 * Best-effort link to the commenter's own profile.
 *
 * Instagram comments carry a real username, so this is a direct,
 * reliable profile URL. Facebook Page comments only carry an APP-SCOPED
 * ID (unique to this app + that person, confirmed against a real
 * comment) -- not their actual global user ID -- and facebook.com/{id}
 * does not resolve an app-scoped ID to a profile. That's Meta's own
 * privacy design (an app is deliberately not allowed to turn an ID into
 * an identity lookup), not something fixable on our end. The closest
 * available fallback is a name search, which isn't guaranteed to land on
 * the right person if the name is common.
 */
export function authorProfileUrl(platform, author) {
  if (platform === 'instagram') {
    return author ? `https://www.instagram.com/${encodeURIComponent(author)}/` : null;
  }
  return author ? `https://www.facebook.com/search/people/?q=${encodeURIComponent(author)}` : null;
}

/**
 * Shared on/off switch -- one definition so the dashboard's
 * auto-deletion control and the Settings page look and behave alike.
 */
export function Switch({ checked, disabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-50 ${
        checked ? 'border-primary bg-primary' : 'border-outline-variant bg-surface-container-high'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

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
  // Flagged = the AI said DELETE but the comment is still up -- either
  // auto-deletion is paused, or the Graph API delete didn't go through.
  const isFlagged = event.verdict === 'DELETE' && !event.deleted && !isError;
  const label = isError
    ? 'Error'
    : isFlagged
      ? 'Flagged'
      : event.verdict === 'DELETE'
        ? 'Deleted'
        : 'Kept';
  const cls = isError
    ? 'bg-secondary-container text-on-secondary-container'
    : isFlagged
      ? 'bg-secondary/10 text-secondary'
      : event.verdict === 'DELETE'
        ? 'bg-primary/10 text-primary'
        : 'bg-good-soft text-good';
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-label-sm font-medium ${cls}`}>
      {label}
    </span>
  );
}
