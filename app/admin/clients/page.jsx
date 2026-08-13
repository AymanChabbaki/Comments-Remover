'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../../components/AppShell';

const EMPTY_FORM = { name: '', email: '', password: '' };

export default function AdminClientsPage() {
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
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  const clientCounts = {
    total: clients.length,
    active: clients.filter((c) => c.active).length,
    paused: clients.filter((c) => !c.active).length,
  };

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
    <AppShell isAdmin subtitle="Add, pause, and manage client accounts" wide>
      <div className="mb-6 animate-fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
            <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-700 active:scale-[0.98]">
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

      <div style={{ animationDelay: '80ms' }} className="animate-fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
                    <a href={`/clients/${c.id}/dashboard`} target="_blank" rel="noreferrer" className="text-xs text-brand-600 dark:text-brand-400">
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
