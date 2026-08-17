'use client';

import { useState } from 'react';
import { ShieldOff, ChevronRight } from 'lucide-react';
import { relativeTime, PlatformBadge, CARD } from './dashboardUi';

/**
 * Full blocked-authors list -- the standalone content of the Blacklist
 * page. `compact` renders it as a smaller collapsible card instead, for
 * the demo pages that show everything on one screen.
 */
export default function BlocklistPanel({ blocked, onUnblock, readOnly, compact }) {
  const [open, setOpen] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const body = blocked.length === 0 ? (
    <div className="py-10 text-center">
      <ShieldOff size={22} className="mx-auto mb-2 text-ink-mute" strokeWidth={1.75} />
      <p className="mx-auto max-w-xs text-sm text-ink-soft">
        No blocked authors yet — they&apos;re added automatically the first time one of their comments is deleted.
      </p>
    </div>
  ) : (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-ink-mute">
          <th className="pb-2.5 font-bold">Platform</th>
          <th className="pb-2.5 font-bold">Author</th>
          <th className="pb-2.5 font-bold">Blocked</th>
          {!readOnly && <th className="pb-2.5 font-bold" />}
        </tr>
      </thead>
      <tbody>
        {blocked.map((b) => (
          <tr key={b.authorId} className="border-t border-line-soft">
            <td className="py-3"><PlatformBadge platform={b.platform} /></td>
            <td className="py-3 font-medium text-ink">{b.authorName || <span className="font-normal text-ink-mute">{b.authorId}</span>}</td>
            <td className="py-3 text-ink-soft">{relativeTime(b.blockedAt)}</td>
            {!readOnly && (
              <td className="py-3 text-right">
                <button
                  type="button"
                  disabled={busyId === b.authorId}
                  onClick={async () => {
                    setBusyId(b.authorId);
                    await onUnblock(b);
                    setBusyId(null);
                  }}
                  className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-brand-400 hover:text-brand-600 disabled:opacity-50"
                >
                  {busyId === b.authorId ? 'Unblocking…' : 'Unblock'}
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (compact) {
    return (
      <div className={CARD}>
        <button onClick={() => setOpen((o) => !o)} type="button" className="flex w-full items-center justify-between p-5 text-left">
          <span className="text-sm font-semibold text-ink">Blocked authors ({blocked.length})</span>
          <ChevronRight size={15} className={`text-ink-mute transition-transform ${open ? 'rotate-90' : ''}`} />
        </button>
        {open && <div className="px-5 pb-5">{body}</div>}
      </div>
    );
  }

  return (
    <div className={`animate-fade-in-up p-6 ${CARD}`}>
      <div className="mb-4 flex items-center gap-2 border-b border-line-soft pb-3">
        <ShieldOff size={15} className="text-brand-600" />
        <span className="text-sm font-semibold text-ink">Blocked authors</span>
        <span className="ml-auto rounded-md bg-paper-alt px-2 py-0.5 text-xs font-bold tabular-nums text-ink-soft">
          {blocked.length}
        </span>
      </div>
      {body}
    </div>
  );
}
