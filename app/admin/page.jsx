'use client';

import { useEffect, useMemo, useState } from 'react';
import { Users, MessageSquare, Trash2, CheckCircle2, AlertTriangle, Percent } from 'lucide-react';
import AppShell from '../../components/AppShell';

const EMPTY_FORM = { name: '', email: '', password: '' };

const STAT_STYLES = {
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  red: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
};

function StatCard({ label, value, icon: Icon, color = 'slate' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${STAT_STYLES[color]}`}>
        <Icon size={18} strokeWidth={2.25} />
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</div>
    </div>
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
      <div className="mb-3 text-sm font-semibold">Activity across all clients, last 24h</div>
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

function relativeTime(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function RecentActivity({ events }) {
  const rows = events.slice(0, 8);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="p-5 pb-0 text-sm font-semibold">Recent activity</div>
      {rows.length === 0 ? (
        <div className="p-5 text-sm text-slate-500 dark:text-slate-400">Nothing moderated yet.</div>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map((e) => (
              <tr key={`${e.clientId}-${e.commentId}`} className="border-t border-slate-100 first:border-t-0 dark:border-slate-800">
                <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{relativeTime(e.timestamp)}</td>
                <td className="px-2 py-2.5 font-medium">{e.clientName}</td>
                <td className="max-w-[240px] truncate px-2 py-2.5 text-slate-500 dark:text-slate-400">{e.text}</td>
                <td className="px-5 py-2.5 text-right">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    e.error
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                      : e.verdict === 'DELETE'
                        ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                  }`}>
                    {e.error ? 'ERROR' : e.verdict}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [clients, setClients] = useState([]);
  const [overview, setOverview] = useState({ stats: { total: 0, deleted: 0, kept: 0, errors: 0 }, recent: [] });
  const [form, setForm] = useState(EMPTY_FORM);
  const [formMsg, setFormMsg] = useState(null); // { text, ok }
  const [busyId, setBusyId] = useState(null);

  async function load() {
    const [clientsRes, statsRes] = await Promise.all([
      fetch('/api/admin/clients'),
      fetch('/api/admin/stats'),
    ]);
    const clientsData = await clientsRes.json();
    const statsData = await statsRes.json();
    setClients(clientsData.clients || []);
    setOverview(statsData);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  const clientCounts = useMemo(() => ({
    total: clients.length,
    active: clients.filter((c) => c.active).length,
    paused: clients.filter((c) => !c.active).length,
  }), [clients]);

  const rate = overview.stats.total ? Math.round((overview.stats.deleted / overview.stats.total) * 100) : 0;

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setFormMsg(null);
    const res = await fetch('/api/admin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!data.success) {
      setFormMsg({ text: data.error, ok: false });
      return;
    }
    setFormMsg({ text: `Added ${data.client.name} — give them their email/password to log in and connect their Page themselves.`, ok: true });
    setForm(EMPTY_FORM);
    await load();
  }

  async function toggleActive(client) {
    setBusyId(client.id);
    await fetch(`/api/admin/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !client.active }),
    });
    await load();
    setBusyId(null);
  }

  async function resetPassword(client) {
    const password = prompt(`New password for ${client.name} (8+ characters):`);
    if (!password) return;
    if (password.length < 8) {
      alert('Password must be at least 8 characters.');
      return;
    }
    setBusyId(client.id);
    const res = await fetch(`/api/admin/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!data.success) alert(`Failed: ${data.error}`);
    await load();
    setBusyId(null);
  }

  async function remove(client) {
    if (!confirm('Delete this client? Their moderation history stays in the log, but they will stop being moderated.')) return;
    setBusyId(client.id);
    await fetch(`/api/admin/clients/${client.id}`, { method: 'DELETE' });
    await load();
    setBusyId(null);
  }

  return (
    <AppShell isAdmin subtitle="Every client, at a glance" wide>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Clients" value={clientCounts.total} icon={Users} color="slate" />
        <StatCard label="Comments moderated" value={overview.stats.total} icon={MessageSquare} color="slate" />
        <StatCard label="Deleted" value={overview.stats.deleted} icon={Trash2} color="red" />
        <StatCard label="Kept" value={overview.stats.kept} icon={CheckCircle2} color="emerald" />
        <StatCard label="Errors" value={overview.stats.errors} icon={AlertTriangle} color="amber" />
        <StatCard label="Delete rate" value={`${rate}%`} icon={Percent} color="blue" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChart events={overview.recent} />
        </div>
        <RecentActivity events={overview.recent} />
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-1 text-sm font-semibold">Add a client</div>
        <p className="mb-3.5 text-xs text-slate-500 dark:text-slate-400">
          This just creates a login — no Page ID or tokens needed from you. The client connects their own Facebook
          Page and Instagram account themselves, after logging in, from their dashboard&apos;s Settings page.
        </p>
        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AdminField label="Client name" value={form.name} onChange={set('name')} required placeholder="e.g. ULTEx" />
          <AdminField label="Email" type="email" value={form.email} onChange={set('email')} required placeholder="owner@business.com" />
          <AdminField label="Password (8+ characters)" type="text" value={form.password} onChange={set('password')} required minLength={8} placeholder="Set something you can tell them" />
          <div className="flex items-center gap-3 sm:col-span-3">
            <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Add client
            </button>
            {formMsg && (
              <span className={`text-sm ${formMsg.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {formMsg.text}
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3.5 flex items-center justify-between">
          <div className="text-sm font-semibold">Clients</div>
          <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">{clientCounts.active} active</span>
            {clientCounts.paused > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-400">{clientCounts.paused} paused</span>
            )}
          </div>
        </div>
        {clients.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No clients yet — add one above.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Connection</th>
                <th className="pb-2 font-medium">Login</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Dashboard</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 align-top dark:border-slate-800">
                  <td className="py-2.5">
                    {c.name}
                    <div className="text-xs text-slate-400">{c.id}</div>
                    {c.email && <div className="text-xs text-slate-400">{c.email}</div>}
                  </td>
                  <td className="py-2.5 text-xs">
                    {c.hasPageToken ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Facebook connected</span>
                    ) : (
                      <span className="text-slate-400">Not connected yet</span>
                    )}
                    {c.hasIgToken && <><br /><span className="text-emerald-600 dark:text-emerald-400">Instagram connected</span></>}
                  </td>
                  <td className="py-2.5 text-slate-500 dark:text-slate-400">{c.hasLogin ? 'Yes' : '—'}</td>
                  <td className="py-2.5">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${c.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'}`}>
                      {c.active ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <a href={`/clients/${c.id}/dashboard`} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 dark:text-emerald-400">
                      Open →
                    </a>
                  </td>
                  <td className="py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        disabled={busyId === c.id}
                        onClick={() => toggleActive(c)}
                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs disabled:opacity-50 dark:border-slate-700"
                      >
                        {c.active ? 'Pause' : 'Resume'}
                      </button>
                      {c.hasLogin && (
                        <button
                          type="button"
                          disabled={busyId === c.id}
                          onClick={() => resetPassword(c)}
                          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs disabled:opacity-50 dark:border-slate-700"
                        >
                          Reset password
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === c.id}
                        onClick={() => remove(c)}
                        className="rounded-md border border-red-400 px-2.5 py-1 text-xs text-red-600 disabled:opacity-50 dark:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}

function AdminField({ label, className = '', ...props }) {
  return (
    <label className={`flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 ${className}`}>
      {label}
      <input
        {...props}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
    </label>
  );
}
