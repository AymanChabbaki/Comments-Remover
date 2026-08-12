'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../../../components/AppShell';

export default function SettingsClient({ clientId, clientName }) {
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({ pageId: '', pageAccessToken: '', igUserId: '', igAccessToken: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch(`/api/clients/${clientId}/settings`);
    const data = await res.json();
    setStatus(data);
    setForm((f) => ({ ...f, pageId: data.pageId || '', igUserId: data.igUserId || '' }));
  }

  useEffect(() => {
    load();
  }, []);

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setMsg({ text: data.error, ok: false });
        return;
      }
      setMsg({ text: 'Saved.', ok: true });
      setForm((f) => ({ ...f, pageAccessToken: '', igAccessToken: '' }));
      await load();
    } catch (err) {
      setMsg({ text: err.message, ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-7 dark:bg-slate-950 sm:px-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{clientName} — Connection Settings</h1>
          <Link href={`/clients/${clientId}/dashboard`} className="text-sm text-blue-600 dark:text-blue-400">
            ← Dashboard
          </Link>
        </div>

        {status && (
          <div className="mb-5 flex gap-3">
            <StatusPill label="Facebook Page" connected={!!status.pageId && status.hasPageToken} />
            <StatusPill label="Instagram" connected={!!status.igUserId && status.hasIgToken} optional />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Get these from the Meta setup guide — your Page ID and Page Access Token. Leave a token field blank to
            keep the one you already saved.
          </p>
          <Field label="Facebook Page ID" value={form.pageId} onChange={set('pageId')} placeholder="106480395512492" />
          <Field
            label={`Page Access Token${status?.hasPageToken ? ' (already set — leave blank to keep it)' : ''}`}
            value={form.pageAccessToken}
            onChange={set('pageAccessToken')}
            placeholder="EAAW..."
          />
          <hr className="my-1 border-slate-200 dark:border-slate-800" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Optional — only if you also want Instagram comments moderated.</p>
          <Field label="Instagram Account ID" value={form.igUserId} onChange={set('igUserId')} placeholder="17841454947560776" />
          <Field
            label={`Instagram Access Token${status?.hasIgToken ? ' (already set — leave blank to keep it)' : ''}`}
            value={form.igAccessToken}
            onChange={set('igAccessToken')}
            placeholder="IGAA..."
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
          {msg && (
            <p className={`text-sm ${msg.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {msg.text}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

function StatusPill({ label, connected, optional }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        connected
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}: {connected ? 'Connected' : optional ? 'Not connected (optional)' : 'Not connected'}
    </span>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
      {label}
      <input
        {...props}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
    </label>
  );
}
