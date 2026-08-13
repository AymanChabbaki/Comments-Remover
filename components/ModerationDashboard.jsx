'use client';

import { useMemo, useState } from 'react';
import { MessageSquare, Trash2, CheckCircle2, AlertTriangle, Percent, Globe2, RefreshCw } from 'lucide-react';
import StatCard from './StatCard';

function relativeTime(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function PlatformBadge({ platform }) {
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

function VerdictBadge({ event }) {
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

function ActivityChart({ events }) {
  const buckets = 24;
  const now = Date.now();
  const hourMs = 3600 * 1000;
  const counts = Array.from({ length: buckets }, () => ({ deleted: 0, kept: 0 }));

  for (const e of events) {
    const age = now - new Date(e.timestamp).getTime();
    const bucket = buckets - 1 - Math.floor(age / hourMs);
    if (bucket < 0 || bucket >= buckets) continue;
    if (e.deleted) counts[bucket].deleted++;
    else if (e.verdict === 'KEEP') counts[bucket].kept++;
  }

  const maxCount = Math.max(1, ...counts.map((c) => c.deleted + c.kept));
  const width = 960;
  const height = 90;
  const gap = 3;
  const barW = width / buckets - gap;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 text-sm font-semibold">Activity, last 24h</div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block h-[90px] w-full overflow-visible">
        {counts.map((c, i) => {
          const x = i * (width / buckets) + gap / 2;
          const total = c.deleted + c.kept;
          const scale = (height - 4) / maxCount;
          const keptH = c.kept * scale;
          const delH = c.deleted * scale;
          const hoursAgo = buckets - 1 - i;
          const title = hoursAgo === 0 ? 'This hour' : `${hoursAgo}h ago`;
          if (total === 0) {
            return <rect key={i} x={x} y={height - 2} width={barW} height={2} rx={1} className="fill-slate-200 dark:fill-slate-800" />;
          }
          return (
            <g key={i}>
              <rect x={x} y={height - keptH} width={barW} height={Math.max(keptH, 1)} rx={1} className="fill-emerald-500 hover:opacity-75">
                <title>{`${title}: ${c.kept} kept`}</title>
              </rect>
              <rect x={x} y={height - keptH - delH} width={barW} height={Math.max(delH, delH > 0 ? 1 : 0)} rx={1} className="fill-red-500 hover:opacity-75">
                <title>{`${title}: ${c.deleted} deleted`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      <div className="mt-2.5 flex gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span><span className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-red-500" />Deleted</span>
        <span><span className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-emerald-500" />Kept</span>
      </div>
    </div>
  );
}

function BlocklistPanel({ blocked, onUnblock, readOnly }) {
  const [open, setOpen] = useState(true);
  const [busyId, setBusyId] = useState(null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <button
        onClick={() => setOpen((o) => !o)}
        type="button"
        className="flex w-full items-center justify-between p-5 text-left"
      >
        <span className="text-sm font-semibold">Blocked authors ({blocked.length})</span>
        <span className={`text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
      </button>
      {open && (
        <div className="px-5 pb-5">
          {blocked.length === 0 ? (
            <div className="py-4 text-sm text-slate-500 dark:text-slate-400">
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
                    <td className="py-2"><PlatformBadge platform={b.platform} /></td>
                    <td className="py-2">{b.authorName || <span className="text-slate-400">{b.authorId}</span>}</td>
                    <td className="py-2 text-slate-500 dark:text-slate-400">{relativeTime(b.blockedAt)}</td>
                    {!readOnly && (
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          disabled={busyId === b.authorId}
                          onClick={async () => {
                            setBusyId(b.authorId);
                            await onUnblock(b);
                            setBusyId(null);
                          }}
                          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:border-brand-400 hover:text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          {busyId === b.authorId ? 'Unblocking…' : 'Unblock'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Dashboard content -- meant to render inside <AppShell>, which
 * provides the sidebar/top bar chrome. Shared between a real client's
 * authenticated dashboard and the public /demo sandbox (fake data,
 * local-only mutation callbacks instead of real API calls).
 */
export default function ModerationDashboard({ events, blocked, onDelete, onUnblock, onRefresh, ctaBanner, readOnly }) {
  const [platform, setPlatform] = useState('');
  const [verdict, setVerdict] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activePreset, setActivePreset] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const stats = useMemo(() => {
    const total = events.length;
    const deleted = events.filter((e) => e.deleted).length;
    const kept = events.filter((e) => e.verdict === 'KEEP').length;
    const errors = events.filter((e) => e.error).length;
    const facebook = events.filter((e) => e.platform === 'facebook').length;
    const instagram = events.filter((e) => e.platform === 'instagram').length;
    const rate = total ? Math.round((deleted / total) * 100) : 0;
    return { total, deleted, kept, errors, facebook, instagram, rate };
  }, [events]);

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
      {ctaBanner}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={stats.total} icon={MessageSquare} color="slate" delay={0} />
        <StatCard label="Deleted" value={stats.deleted} icon={Trash2} color="red" delay={50} />
        <StatCard label="Kept" value={stats.kept} icon={CheckCircle2} color="emerald" delay={100} />
        <StatCard label="Errors" value={stats.errors} icon={AlertTriangle} color="amber" delay={150} />
        <StatCard label="Delete rate" value={`${stats.rate}%`} icon={Percent} color="blue" delay={200} />
        <StatCard label="FB / IG" value={`${stats.facebook} / ${stats.instagram}`} icon={Globe2} color="slate" delay={250} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChart events={events} />
        </div>
        <BlocklistPanel blocked={blocked} onUnblock={onUnblock} readOnly={readOnly} />
      </div>

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
