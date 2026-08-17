'use client';

import { useMemo, useState } from 'react';
import { RefreshCw, Search, Inbox, Trash2, CircleCheck, Eye } from 'lucide-react';
import { relativeTime, PlatformBadge, CARD } from './dashboardUi';

const FIELD =
  'rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 py-1.5 text-sm text-on-surface outline-none transition-colors focus:border-primary';

/** Filterable comment log + manual delete -- the Comments page's content, styled as an audit log. */
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
    <div className="flex flex-col gap-6">
      <div className={`p-6 ${CARD}`}>
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
          <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 py-1.5 transition-colors focus-within:border-primary">
            <Search size={14} className="shrink-0 text-on-surface-variant" />
            <input
              type="search"
              placeholder="Search comment text or author…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
            />
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-on-primary shadow-sm shadow-primary/20 transition-colors hover:bg-primary-container active:scale-95"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-surface-container-high pt-3">
          <div className="flex gap-1">
            {[['Today', 1], ['7 days', 7], ['30 days', 30], ['All time', 0]].map(([label, days]) => (
              <button
                key={label}
                type="button"
                onClick={() => applyPreset(days)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  activePreset === String(days)
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setActivePreset(''); }} className={FIELD} />
          <span className="text-xs text-on-surface-variant">&ndash;</span>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setActivePreset(''); }} className={FIELD} />
          <span className="ml-auto text-xs tabular-nums text-on-surface-variant">
            {filtered.length} of {events.length} shown
          </span>
        </div>
      </div>

      <section className={`overflow-hidden ${CARD}`}>
        <div className="flex items-center justify-between border-b border-surface-container-high bg-surface-container-lowest p-6">
          <h2 className="text-headline-md text-on-surface">Audit Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm text-on-surface">
            <thead className="border-b border-surface-container-high bg-surface-container-lowest text-label-sm uppercase text-on-surface-variant">
              <tr>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Platform</th>
                <th className="px-6 py-4 font-medium">Comment</th>
                <th className="px-6 py-4 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high bg-surface-container-lowest">
              {filtered.map((e) => {
                const isError = !!e.error;
                const actionCls = isError
                  ? 'bg-secondary/10 text-secondary'
                  : e.verdict === 'DELETE'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-good-soft text-good';
                const ActionIcon = isError ? Eye : e.verdict === 'DELETE' ? Trash2 : CircleCheck;
                const actionLabel = isError ? 'Error' : e.verdict === 'DELETE' ? 'Deleted' : 'Kept';
                return (
                  <tr key={e.commentId} className="transition-colors hover:bg-surface-container-lowest/50">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${actionCls}`}>
                        <ActionIcon size={14} /> {actionLabel}
                      </span>
                      {e.autoBlocked && (
                        <span className="ml-1.5 inline-block rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                          Blocklisted
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={e.platform} />
                        {e.author && <span className="text-on-surface-variant">{e.author}</span>}
                      </div>
                    </td>
                    <td className="max-w-[320px] px-6 py-4 text-on-surface-variant">
                      <div className="truncate">{e.text}</div>
                      {e.error && <div className="mt-1 truncate text-xs text-secondary">{e.error}</div>}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-xs text-on-surface-variant">
                      <div title={new Date(e.timestamp).toLocaleString()}>{relativeTime(e.timestamp)}</div>
                      {!e.deleted && !readOnly && (
                        <button
                          type="button"
                          disabled={deletingId === e.commentId}
                          onClick={() => handleDelete(e)}
                          className="mt-1 rounded-md border border-primary/30 px-2 py-0.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                        >
                          {deletingId === e.commentId ? 'Deleting…' : 'Delete'}
                        </button>
                      )}
                      {e.deleted && e.manual && <div className="mt-0.5 text-[10px] text-on-surface-variant">(manual)</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Inbox size={24} className="mx-auto mb-2 text-on-surface-variant" strokeWidth={1.75} />
              <p className="text-sm text-on-surface-variant">No comments match the current filters.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
