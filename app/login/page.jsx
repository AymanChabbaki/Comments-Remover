'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Zap, Globe2, Phone } from 'lucide-react';
import Logo from '../../components/Logo';

const SUPPORT_PHONE = '0703285402';

// Only ever treated as a same-site path -- "//evil.com" or
// "https://evil.com" would otherwise let a crafted /login?next= link send
// someone who correctly enters their real password on to an attacker's
// site right after. A single leading "/" (and not "//") is the only
// shape a legitimate post-login redirect within this app ever takes.
function safeNext(value) {
  if (typeof value !== 'string') return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

const POINTS = [
  { icon: Zap, text: 'Comments checked and removed within seconds of being posted.' },
  { icon: Globe2, text: 'Reads French, English, Arabic, and Darija — including Arabizi.' },
  { icon: ShieldCheck, text: 'Your credentials stay yours: one-click connect, revocable any time.' },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));

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
    <div className="flex min-h-screen bg-paper">
      {/* Left: navy brand panel -- always dark, so it always takes the white logo. */}
      <div className="relative hidden w-[46%] shrink-0 overflow-hidden bg-navy-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        <div className="absolute -left-28 -top-28 h-80 w-80 animate-blob rounded-full bg-brand-600/25 blur-3xl" />
        <div className="animation-delay-2000 absolute -bottom-20 -right-20 h-96 w-96 animate-blob rounded-full bg-brand-800/30 blur-3xl" />

        <div className="relative z-10 animate-fade-in">
          <Logo variant="full" height={46} forceLight />
        </div>

        <div className="animate-fade-in-up relative z-10 flex flex-col gap-8">
          <h2 className="font-display max-w-md text-[34px] font-bold leading-[1.15] text-white">
            Comment moderation that runs while you&apos;re busy running the business.
          </h2>
          <ul className="flex flex-col gap-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600/25">
                  <Icon size={14} className="text-brand-200" strokeWidth={2.25} />
                </span>
                <span className="text-sm leading-relaxed text-navy-200">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-xs text-navy-400">
          Tech Hermanos · Digital Agency
        </div>
      </div>

      {/* Right: the form */}
      <div className="bg-grain flex flex-1 items-center justify-center p-6">
        <div className="animate-fade-in-up w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo height={34} />
          </div>

          <h1 className="font-display mb-1.5 text-[26px] font-bold text-ink">Welcome back</h1>
          <p className="mb-8 text-sm text-ink-soft">Log in to your moderation dashboard.</p>

          {error && (
            <div className="animate-fade-in mb-5 rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-mute">
              Email
              <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-2.5 transition-colors focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-600/8">
                <Mail size={15} className="shrink-0 text-ink-mute" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm font-normal normal-case tracking-normal text-ink outline-none placeholder:text-ink-mute"
                  placeholder="you@business.com"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-mute">
              Password
              <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-2.5 transition-colors focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-600/8">
                <Lock size={15} className="shrink-0 text-ink-mute" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm font-normal normal-case tracking-normal text-ink outline-none placeholder:text-ink-mute"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  className="shrink-0 text-ink-mute transition-colors hover:text-ink"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? 'Logging in…' : 'Log in'}
              {!busy && <ArrowRight size={15} />}
            </button>
          </form>

          <div className="mt-8 border-t border-line pt-5">
            <a
              href={`tel:${SUPPORT_PHONE}`}
              className="flex items-center justify-center gap-1.5 text-xs text-ink-mute transition-colors hover:text-brand-600"
            >
              <Phone size={12} /> Forgot your password? Call {SUPPORT_PHONE}
            </a>
          </div>
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
