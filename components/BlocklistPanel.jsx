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
      <ShieldOff size={22} className="mx-auto mb-2 text-on-surface-variant" strokeWidth={1.75} />
      <p className="mx-auto max-w-xs text-sm text-on-surface-variant">
        No blocked authors yet — they&apos;re added automatically the first time one of their comments is deleted.
      </p>
    </div>
  ) : (
    <table className="w-full text-left text-sm text-on-surface">
      <thead className="border-b border-surface-container-high text-label-sm uppercase text-on-surface-variant">
        <tr>
          <th className="px-4 py-3 font-medium">Platform</th>
          <th className="px-4 py-3 font-medium">Author</th>
          <th className="px-4 py-3 font-medium">Blocked</th>
          {!readOnly && <th className="px-4 py-3 font-medium" />}
        </tr>
      </thead>
      <tbody className="divide-y divide-surface-container-high">
        {blocked.map((b) => (
          <tr key={b.authorId} className="transition-colors hover:bg-surface-container-lowest/50">
            <td className="px-4 py-3"><PlatformBadge platform={b.platform} /></td>
            <td className="px-4 py-3 font-medium text-on-surface">{b.authorName || <span className="font-normal text-on-surface-variant">{b.authorId}</span>}</td>
            <td className="px-4 py-3 text-on-surface-variant">{relativeTime(b.blockedAt)}</td>
            {!readOnly && (
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  disabled={busyId === b.authorId}
                  onClick={async () => {
                    setBusyId(b.authorId);
                    await onUnblock(b);
                    setBusyId(null);
                  }}
                  className="rounded-md border border-outline-variant px-2.5 py-1 text-xs font-medium text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
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
          <span className="text-sm font-semibold text-on-surface">Blocked authors ({blocked.length})</span>
          <ChevronRight size={15} className={`text-on-surface-variant transition-transform ${open ? 'rotate-90' : ''}`} />
        </button>
        {open && <div className="border-t border-surface-container-high">{body}</div>}
      </div>
    );
  }

  return (
    <section className={`overflow-hidden ${CARD}`}>
      <div className="flex items-center gap-2 border-b border-surface-container-high bg-surface-container-lowest p-6">
        <ShieldOff size={16} className="text-primary" />
        <h2 className="text-headline-md text-on-surface">Blocked Authors</h2>
        <span className="ml-auto rounded-md bg-surface-container px-2 py-0.5 font-mono text-xs font-bold text-on-surface-variant">
          {blocked.length}
        </span>
      </div>
      {body}
    </section>
  );
}
