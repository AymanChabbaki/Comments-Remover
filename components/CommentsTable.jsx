'use client';

import { useMemo, useState } from 'react';
import { RefreshCw, Search, Inbox } from 'lucide-react';
import { relativeTime, PlatformBadge, VerdictBadge, CARD } from './dashboardUi';

const FIELD = 'rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink outline-none transition-colors focus:border-brand-400';

/** Filterable comment log + manual delete -- the Comments page's content. */
export default function CommentsTable({ events, onDelete, onRefresh, readOnly }) {
  const [platform, setPlatform] = useState('');
  const [verdict, setVerdict] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activePreset, setActivePreset] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const filtered = useMemo(() => {
    const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toMs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

    return events.filter((e) => {
      if (platform && e.platform !== platform) return false;
      if (verdict === 'ERROR' && !e.error) return false;
      if (verdict === 'DELETE' && e.verdict !== 'DELETE') return false;
      if (verdict === 'KEEP' && e.verdict !== 'KEEP') return false;
      if (search) {
        const hay = `${e.text || ''} ${e.author || ''}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      const t = new Date(e.timestamp).getTime();
      if (fromMs !== null && t < fromMs) return false;
      if (toMs !== null && t > toMs) return false;
      return true;
    });
  }, [events, platform, verdict, search, dateFrom, dateTo]);

  function applyPreset(days) {
    setActivePreset(String(days));
    if (days === 0) {
      setDateFrom('');
      setDateTo('');
      return;
    }
    const to = new Date();
    const from = new Date(Date.now() - (days - 1) * 86400000);
    const toLocal = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    setDateFrom(toLocal(from));
    setDateTo(toLocal(to));
  }

  async function handleDelete(event) {
    if (!confirm('Delete this comment? This cannot be undone.')) return;
    setDeletingId(event.commentId);
    try {
      await onDelete(event);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {/* Filters live in one band above the table, not scattered. */}
      <div className={`mb-5 p-4 ${CARD}`}>
        <div className="flex flex-wrap items-center gap-2">
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={FIELD}>
            <option value="">All platforms</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
          </select>
          <select value={verdict} onChange={(e) => setVerdict(e.target.value)} className={FIELD}>
            <option value="">All verdicts</option>
            <option value="DELETE">Deleted</option>
            <option value="KEEP">Kept</option>
            <option value="ERROR">Errors</option>
          </select>
          <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 transition-colors focus-within:border-brand-400">
            <Search size={14} className="shrink-0 text-ink-mute" />
            <input
              type="search"
              placeholder="Search comment text or author…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-mute"
            />
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 active:scale-95"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line-soft pt-3">
          <div className="flex gap-1">
            {[['Today', 1], ['7 days', 7], ['30 days', 30], ['All time', 0]].map(([label, days]) => (
              <button
                key={label}
                type="button"
                onClick={() => applyPreset(days)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  activePreset === String(days)
                    ? 'bg-brand-600 text-white'
                    : 'text-ink-soft hover:bg-paper-alt hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setActivePreset(''); }}
            className={FIELD}
          />
          <span className="text-xs text-ink-mute">&ndash;</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setActivePreset(''); }}
            className={FIELD}
          />
          <span className="ml-auto text-xs tabular-nums text-ink-mute">
            {filtered.length} of {events.length} shown
          </span>
        </div>
      </div>

      <div className={`overflow-x-auto ${CARD}`}>
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line bg-paper-alt/60 text-left text-[10px] uppercase tracking-[0.12em] text-ink-mute">
              <th className="px-4 py-3 font-bold">Time</th>
              <th className="px-4 py-3 font-bold">Platform</th>
              <th className="px-4 py-3 font-bold">Author</th>
              <th className="px-4 py-3 font-bold">Comment</th>
              <th className="px-4 py-3 font-bold">Verdict</th>
              <th className="px-4 py-3 font-bold">Deleted</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.commentId} className="border-t border-line-soft transition-colors hover:bg-paper/70">
                <td className="whitespace-nowrap px-4 py-3 text-ink-mute" title={new Date(e.timestamp).toLocaleString()}>
                  {relativeTime(e.timestamp)}
                </td>
                <td className="px-4 py-3"><PlatformBadge platform={e.platform} /></td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-ink-soft">
                  {e.author || <span className="text-ink-mute">—</span>}
                </td>
                <td className="max-w-[420px] px-4 py-3">
                  <div className="whitespace-pre-wrap break-words text-ink">{e.text}</div>
                  {e.error && <div className="mt-1 text-xs text-warn">{e.error}</div>}
                </td>
                <td className="px-4 py-3">
                  <VerdictBadge event={e} />
                  {e.autoBlocked && (
                    <span className="ml-1.5 inline-block rounded-md bg-danger-soft px-1.5 py-0.5 text-[10px] font-bold uppercase text-danger">
                      Blocklisted
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {e.deleted ? (
                    <span className="font-semibold text-danger">
                      Yes {e.manual && <span className="font-normal text-ink-mute">(manual)</span>}
                    </span>
                  ) : readOnly ? (
                    <span className="text-ink-mute">No</span>
                  ) : (
                    <button
                      type="button"
                      disabled={deletingId === e.commentId}
                      onClick={() => handleDelete(e)}
                      className="rounded-md border border-danger/40 px-2.5 py-1 text-xs font-semibold text-danger transition-colors hover:bg-danger-soft disabled:opacity-50"
                    >
                      {deletingId === e.commentId ? 'Deleting…' : 'Delete'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Inbox size={24} className="mx-auto mb-2 text-ink-mute" strokeWidth={1.75} />
            <p className="text-sm text-ink-soft">No comments match the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
