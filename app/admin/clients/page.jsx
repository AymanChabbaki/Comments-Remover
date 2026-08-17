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
      <div className="mb-6 animate-fade-in-up rounded-xl border border-surface-container-high bg-surface-container-lowest p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="mb-1 text-sm font-semibold">Add a client</div>
        <p className="mb-3.5 text-xs text-on-surface-variant">
          This just creates a login — no Page ID or tokens needed from you. The client connects their own Facebook
          Page and Instagram account themselves, after logging in, from their dashboard&apos;s Settings page.
        </p>
        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AdminField label="Client name" value={form.name} onChange={set('name')} required placeholder="e.g. ULTEx" />
          <AdminField label="Email" type="email" value={form.email} onChange={set('email')} required placeholder="owner@business.com" />
          <AdminField label="Password (8+ characters)" type="text" value={form.password} onChange={set('password')} required minLength={8} placeholder="Set something you can tell them" />
          <div className="flex items-center gap-3 sm:col-span-3">
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-container active:scale-[0.98]">
              Add client
            </button>
            {formMsg && (
              <span className={`text-sm ${formMsg.ok ? 'text-good' : 'text-error'}`}>
                {formMsg.text}
              </span>
            )}
          </div>
        </form>
      </div>

      <div style={{ animationDelay: '80ms' }} className="animate-fade-in-up rounded-xl border border-surface-container-high bg-surface-container-lowest p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="mb-3.5 flex items-center justify-between">
          <div className="text-sm font-semibold">Clients</div>
          <div className="flex gap-2 text-xs text-on-surface-variant">
            <span className="rounded-full bg-good-soft px-2 py-0.5 font-semibold text-good">{clientCounts.active} active</span>
            {clientCounts.paused > 0 && (
              <span className="rounded-full bg-error-container px-2 py-0.5 font-semibold text-error">{clientCounts.paused} paused</span>
            )}
          </div>
        </div>
        {clients.length === 0 ? (
          <div className="py-8 text-center text-sm text-on-surface-variant">No clients yet — add one above.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-on-surface-variant">
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
                <tr key={c.id} className="border-t border-surface-container-high align-top">
                  <td className="py-2.5">
                    {c.name}
                    <div className="text-xs text-on-surface-variant">{c.id}</div>
                    {c.email && <div className="text-xs text-on-surface-variant">{c.email}</div>}
                  </td>
                  <td className="py-2.5 text-xs">
                    {c.hasPageToken ? (
                      <span className="text-good">Facebook connected</span>
                    ) : (
                      <span className="text-on-surface-variant">Not connected yet</span>
                    )}
                    {c.hasIgToken && <><br /><span className="text-good">Instagram connected</span></>}
                  </td>
                  <td className="py-2.5 text-on-surface-variant">{c.hasLogin ? 'Yes' : '—'}</td>
                  <td className="py-2.5">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${c.active ? 'bg-good-soft text-good' : 'bg-error-container text-error'}`}>
                      {c.active ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <a href={`/clients/${c.id}/dashboard`} target="_blank" rel="noreferrer" className="text-xs text-primary">
                      Open →
                    </a>
                  </td>
                  <td className="py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        disabled={busyId === c.id}
                        onClick={() => toggleActive(c)}
                        className="rounded-md border border-surface-container-high px-2.5 py-1 text-xs disabled:opacity-50"
                      >
                        {c.active ? 'Pause' : 'Resume'}
                      </button>
                      {c.hasLogin && (
                        <button
                          type="button"
                          disabled={busyId === c.id}
                          onClick={() => resetPassword(c)}
                          className="rounded-md border border-surface-container-high px-2.5 py-1 text-xs disabled:opacity-50"
                        >
                          Reset password
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === c.id}
                        onClick={() => remove(c)}
                        className="rounded-md border border-error/40 px-2.5 py-1 text-xs text-error disabled:opacity-50"
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
    <label className={`flex flex-col gap-1 text-xs text-on-surface-variant ${className}`}>
      {label}
      <input
        {...props}
        className="rounded-lg border border-surface-container-high bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
      />
    </label>
  );
}
