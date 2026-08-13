'use client';

import { useState } from 'react';
import { ShieldOff } from 'lucide-react';
import { relativeTime, PlatformBadge } from './dashboardUi';

/**
 * Full blocked-authors list. Used as the standalone content of the
 * Blacklist page -- `compact` renders it as a smaller collapsible card
 * instead, for reuse on the demo pages that show everything on one
 * screen.
 */
export default function BlocklistPanel({ blocked, onUnblock, readOnly, compact }) {
  const [open, setOpen] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const body = blocked.length === 0 ? (
    <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
      No blocked authors yet — they&apos;re added automatically the first time one of their comments is deleted.
    </div>
  ) : (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase text-slate-500 dark:text-slate-400">
          <th className="pb-2 font-medium">Platform</th>
          <th className="pb-2 font-medium">Author</th>
          <th className="pb-2 font-medium">Blocked</th>
          {!readOnly && <th className="pb-2 font-medium" />}
        </tr>
      </thead>
      <tbody>
        {blocked.map((b) => (
          <tr key={b.authorId} className="border-t border-slate-100 dark:border-slate-800">
            <td className="py-2.5"><PlatformBadge platform={b.platform} /></td>
            <td className="py-2.5">{b.authorName || <span className="text-slate-400">{b.authorId}</span>}</td>
            <td className="py-2.5 text-slate-500 dark:text-slate-400">{relativeTime(b.blockedAt)}</td>
            {!readOnly && (
              <td className="py-2.5 text-right">
                <button
                  type="button"
                  disabled={busyId === b.authorId}
                  onClick={async () => {
                    setBusyId(b.authorId);
                    await onUnblock(b);
                    setBusyId(null);
                  }}
                  className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-500 transition-colors hover:border-brand-400 hover:text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
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
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <button onClick={() => setOpen((o) => !o)} type="button" className="flex w-full items-center justify-between p-5 text-left">
          <span className="text-sm font-semibold">Blocked authors ({blocked.length})</span>
          <span className={`text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {open && <div className="px-5 pb-5">{body}</div>}
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <ShieldOff size={16} className="text-brand-600 dark:text-brand-400" />
        Blocked authors ({blocked.length})
      </div>
      {body}
    </div>
  );
}
