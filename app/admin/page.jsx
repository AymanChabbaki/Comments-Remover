'use client';

import { useEffect, useState } from 'react';
import ThemeToggle from '../../components/ThemeToggle';

const EMPTY_FORM = { name: '', pageId: '', pageAccessToken: '', igUserId: '', igAccessToken: '' };

export default function AdminPage() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formMsg, setFormMsg] = useState(null); // { text, ok }
  const [busyId, setBusyId] = useState(null);

  async function load() {
    const res = await fetch('/api/admin/clients');
    const data = await res.json();
    setClients(data.clients || []);
  }

  useEffect(() => {
    load();
  }, []);

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
    setFormMsg({ text: `Added ${data.client.name}`, ok: true });
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

  async function remove(client) {
    if (!confirm('Delete this client? Their moderation history stays in the log, but they will stop being moderated.')) return;
    setBusyId(client.id);
    await fetch(`/api/admin/clients/${client.id}`, { method: 'DELETE' });
    await load();
    setBusyId(null);
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-7 dark:bg-slate-950 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Client Admin</h1>
          <ThemeToggle />
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3.5 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Add a client</div>
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AdminField label="Client name" value={form.name} onChange={set('name')} required placeholder="e.g. ULTEx" />
            <AdminField label="Facebook Page ID" value={form.pageId} onChange={set('pageId')} required placeholder="106480395512492" />
            <AdminField className="sm:col-span-2" label="Page Access Token" value={form.pageAccessToken} onChange={set('pageAccessToken')} required placeholder="EAAW..." />
            <AdminField label="Instagram Account ID (optional)" value={form.igUserId} onChange={set('igUserId')} placeholder="17841454947560776" />
            <AdminField label="Instagram Access Token (optional)" value={form.igAccessToken} onChange={set('igAccessToken')} placeholder="IGAA..." />
            <div className="flex items-center gap-3 sm:col-span-2">
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
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

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3.5 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Clients</div>
          {clients.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No clients yet — add one above.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">IDs</th>
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
                    </td>
                    <td className="py-2.5 text-xs text-slate-500 dark:text-slate-400">
                      Page: {c.pageId}
                      {c.igUserId && <><br />IG: {c.igUserId}</>}
                    </td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">{c.hasLogin ? 'Self-serve' : '—'}</td>
                    <td className="py-2.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${c.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'}`}>
                        {c.active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <a href={`/clients/${c.id}/dashboard`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400">
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
      </div>
    </div>
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
