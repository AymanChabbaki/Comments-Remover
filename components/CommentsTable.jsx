'use client';

import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { relativeTime, PlatformBadge, VerdictBadge } from './dashboardUi';

/**
 * Filterable comment log + manual delete. The Comments page's whole
 * content -- split out of what used to be one monolithic
 * ModerationDashboard component so Dashboard/Comments/Blacklist can each
 * be their own page instead of one long scroll.
 */
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
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">All platforms</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
        </select>
        <select
          value={verdict}
          onChange={(e) => setVerdict(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">All verdicts</option>
          <option value="DELETE">Deleted</option>
          <option value="KEEP">Kept</option>
          <option value="ERROR">Errors</option>
        </select>
        <input
          type="search"
          placeholder="Search comment text or author…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[160px] flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-transform hover:bg-brand-700 active:scale-95"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {[['Today', 1], ['7 days', 7], ['30 days', 30], ['All time', 0]].map(([label, days]) => (
            <button
              key={label}
              type="button"
              onClick={() => applyPreset(days)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                activePreset === String(days)
                  ? 'border-brand-400 bg-brand-50 text-slate-900 dark:bg-brand-500/10 dark:text-slate-100'
                  : 'border-slate-200 text-slate-500 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400'
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
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <span className="text-xs text-slate-400">–</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setActivePreset(''); }}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
          {filtered.length} of {events.length} shown
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Platform</th>
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Comment</th>
              <th className="px-4 py-3 font-medium">Verdict</th>
              <th className="px-4 py-3 font-medium">Deleted</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900">
            {filtered.map((e) => (
              <tr key={e.commentId} className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400" title={new Date(e.timestamp).toLocaleString()}>
                  {relativeTime(e.timestamp)}
                </td>
                <td className="px-4 py-3"><PlatformBadge platform={e.platform} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                  {e.author || <span className="text-slate-400">—</span>}
                </td>
                <td className="max-w-[420px] px-4 py-3">
                  <div className="whitespace-pre-wrap break-words">{e.text}</div>
                  {e.error && <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">{e.error}</div>}
                </td>
                <td className="px-4 py-3">
                  <VerdictBadge event={e} />
                  {e.autoBlocked && (
                    <span className="ml-1.5 inline-block rounded-full border border-red-300 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                      BLOCKLISTED
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {e.deleted ? (
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      Yes {e.manual && <span className="font-normal text-slate-400">(manual)</span>}
                    </span>
                  ) : readOnly ? (
                    <span className="text-slate-400">No</span>
                  ) : (
                    <button
                      type="button"
                      disabled={deletingId === e.commentId}
                      onClick={() => handleDelete(e)}
                      className="rounded-md border border-red-400 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10"
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
          <div className="bg-white py-12 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            No comments match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
