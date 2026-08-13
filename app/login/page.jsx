'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles, Phone } from 'lucide-react';
import Logo from '../../components/Logo';

const SUPPORT_PHONE = '0703285402';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }
      if (next) {
        router.push(next);
      } else if (!data.connected) {
        router.push(`/clients/${data.clientId}/onboarding`);
      } else {
        router.push(`/clients/${data.clientId}/dashboard`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      {/* Left: brand panel. Wrapped in a forced "dark" scope so the white
          logo variant renders here regardless of the site's own theme --
          this panel is always colored, so it always needs the light mark. */}
      <div className="dark relative hidden w-[45%] shrink-0 overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-navy-600 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="absolute -left-24 -top-24 h-72 w-72 animate-blob rounded-full bg-white/10 blur-3xl" />
        <div className="animation-delay-2000 absolute bottom-0 right-0 h-96 w-96 animate-blob rounded-full bg-brand-navy-400/30 blur-3xl" />
        <div className="animation-delay-4000 absolute left-1/3 top-1/2 h-64 w-64 animate-blob rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 animate-fade-in">
          <Logo height={32} />
        </div>

        <div className="relative z-10 flex flex-col gap-6 animate-fade-in-up">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Sparkles size={22} className="text-white" />
          </div>
          <h2 className="font-display text-3xl font-bold leading-tight text-white">
            AI comment moderation, running quietly in the background.
          </h2>
          <p className="max-w-sm text-sm text-brand-50/90">
            Every comment on your Facebook Page and Instagram account, checked and cleaned up automatically —
            spam, toxicity, and negativity gone before anyone sees it.
          </p>
          <div className="flex items-center gap-2 text-xs text-brand-50/80">
            <ShieldCheck size={16} />
            Your Page and Instagram credentials stay yours — connected with one click, revocable any time.
          </div>
        </div>

        <div className="relative z-10" />
      </div>

      {/* Right: the actual form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo height={32} />
          </div>

          <h1 className="font-display mb-1 text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mb-7 text-sm text-slate-500 dark:text-slate-400">Log in to your moderation dashboard.</p>

          {error && (
            <div className="mb-4 animate-fade-in rounded-lg border border-red-400 bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              Email
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 transition-colors focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-400/10 dark:border-slate-700 dark:bg-slate-900">
                <Mail size={16} className="shrink-0 text-slate-400" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-slate-100"
                  placeholder="you@business.com"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              Password
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 transition-colors focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-400/10 dark:border-slate-700 dark:bg-slate-900">
                <Lock size={16} className="shrink-0 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-slate-100"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  className="shrink-0 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? 'Logging in…' : 'Log in'}
              {!busy && <ArrowRight size={16} />}
            </button>
          </form>

          <a
            href={`tel:${SUPPORT_PHONE}`}
            className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-brand-600 dark:hover:text-brand-400"
          >
            <Phone size={12} /> Forgot your password? Call {SUPPORT_PHONE}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
