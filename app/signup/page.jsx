'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', pageId: '', pageAccessToken: '', igUserId: '', igAccessToken: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }
      router.push(`/clients/${data.clientId}/dashboard`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="mb-4 text-lg font-semibold">Sign up</h1>
        {error && (
          <div className="mb-4 rounded-lg border border-red-400 bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field label="Business name" value={form.name} onChange={set('name')} required />
          <Field label="Email" type="email" value={form.email} onChange={set('email')} required />
          <Field label="Password (8+ characters)" type="password" value={form.password} onChange={set('password')} required minLength={8} />
          <hr className="my-1 border-slate-200 dark:border-slate-800" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Get these from the Meta setup guide — your Page ID and Page Access Token.</p>
          <Field label="Facebook Page ID" value={form.pageId} onChange={set('pageId')} required />
          <Field label="Page Access Token" value={form.pageAccessToken} onChange={set('pageAccessToken')} required />
          <p className="text-xs text-slate-500 dark:text-slate-400">Optional — only if you also want Instagram comments moderated.</p>
          <Field label="Instagram Account ID (optional)" value={form.igUserId} onChange={set('igUserId')} />
          <Field label="Instagram Access Token (optional)" value={form.igAccessToken} onChange={set('igAccessToken')} />
          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? 'Creating account…' : 'Create account'}
          </button>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account? <Link href="/login" className="text-blue-600 dark:text-blue-400">Log in</Link>
          </p>
        </form>
      </div>
    </div>
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
