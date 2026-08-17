'use client';

import { useEffect, useState } from 'react';
import { User, Mail, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import AppShell from '../../../../components/AppShell';

export default function ProfileClient({ clientId, clientName }) {
  const [form, setForm] = useState({ name: '', email: '' });
  const [infoMsg, setInfoMsg] = useState(null);
  const [infoBusy, setInfoBusy] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/clients/${clientId}/profile`)
      .then((res) => res.json())
      .then((data) => setForm({ name: data.name || '', email: data.email || '' }));
  }, [clientId]);

  async function saveInfo(e) {
    e.preventDefault();
    setInfoMsg(null);
    setInfoBusy(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email }),
      });
      const data = await res.json();
      setInfoMsg(data.success ? { text: 'Saved.', ok: true } : { text: data.error, ok: false });
    } catch (err) {
      setInfoMsg({ text: err.message, ok: false });
    } finally {
      setInfoBusy(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ text: 'New passwords do not match.', ok: false });
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPwMsg({ text: 'Password updated.', ok: true });
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPwMsg({ text: data.error, ok: false });
      }
    } catch (err) {
      setPwMsg({ text: err.message, ok: false });
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <AppShell clientId={clientId} clientName={clientName} subtitle="Your account">
      <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
        <form
          onSubmit={saveInfo}
          className="animate-fade-in-up flex flex-col gap-3 rounded-xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(31,36,44,0.04)]"
        >
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <User size={16} className="text-brand-600" /> Account details
          </div>
          <Field icon={User} label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          <Field icon={Mail} label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
          <button
            type="submit"
            disabled={infoBusy}
            className="mt-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-transform hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50"
          >
            {infoBusy ? 'Saving…' : 'Save changes'}
          </button>
          {infoMsg && (
            <p className={`text-sm ${infoMsg.ok ? 'text-good' : 'text-danger'}`}>
              {infoMsg.text}
            </p>
          )}
        </form>

        <form
          onSubmit={savePassword}
          style={{ animationDelay: '80ms' }}
          className="animate-fade-in-up flex flex-col gap-3 rounded-xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(31,36,44,0.04)]"
        >
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <KeyRound size={16} className="text-brand-600" /> Change password
          </div>
          <Field
            icon={ShieldCheck}
            label="Current password"
            type={showPw ? 'text' : 'password'}
            value={pwForm.currentPassword}
            onChange={(v) => setPwForm((f) => ({ ...f, currentPassword: v }))}
          />
          <Field
            icon={KeyRound}
            label="New password"
            type={showPw ? 'text' : 'password'}
            value={pwForm.newPassword}
            onChange={(v) => setPwForm((f) => ({ ...f, newPassword: v }))}
          />
          <Field
            icon={KeyRound}
            label="Confirm new password"
            type={showPw ? 'text' : 'password'}
            value={pwForm.confirmPassword}
            onChange={(v) => setPwForm((f) => ({ ...f, confirmPassword: v }))}
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="flex w-fit items-center gap-1.5 text-xs text-ink-mute hover:text-ink-soft"
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPw ? 'Hide passwords' : 'Show passwords'}
          </button>
          <button
            type="submit"
            disabled={pwBusy}
            className="mt-1 rounded-lg border border-line py-2.5 text-sm font-semibold transition-all hover:border-brand-400 active:scale-[0.98] disabled:opacity-50"
          >
            {pwBusy ? 'Updating…' : 'Update password'}
          </button>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.ok ? 'text-good' : 'text-danger'}`}>
              {pwMsg.text}
            </p>
          )}
        </form>
      </div>
    </AppShell>
  );
}

function Field({ icon: Icon, label, type = 'text', value, onChange }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-ink-soft">
      {label}
      <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 transition-colors focus-within:border-brand-400">
        <Icon size={14} className="shrink-0 text-ink-mute" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm text-ink outline-none"
        />
      </div>
    </label>
  );
}
