'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, ExternalLink, Copy, Check, Mail, Phone } from 'lucide-react';

const SUPPORT_PHONE = '0703285402';
import Logo from '../../../../components/Logo';
import ThemeToggle from '../../../../components/ThemeToggle';

const SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_engagement',
  'pages_read_user_content',
  'pages_manage_metadata',
];

function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 pr-12 text-sm text-emerald-300 dark:bg-black">
        <code>{children}</code>
      </pre>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(children);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute right-3 top-3 rounded-md bg-slate-700 p-1.5 text-slate-300 hover:bg-slate-600"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}

export default function OnboardingClient({ clientId, clientName, clientEmail, igAppId }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ pageId: '', pageAccessToken: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [igBusy, setIgBusy] = useState(false);

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function finish() {
    setError('');
    setBusy(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }
      router.push(`/clients/${clientId}/dashboard`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Saves whatever Facebook fields are already filled in (partial PATCH is
  // fine, blanks are ignored server-side) before leaving the page for
  // Instagram's consent screen -- otherwise unsaved wizard state would be
  // lost on the redirect away.
  async function connectInstagram() {
    setError('');
    setIgBusy(true);
    try {
      if (form.pageId || form.pageAccessToken) {
        await fetch(`/api/clients/${clientId}/settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      const redirectUri = `${window.location.origin}/api/oauth/instagram/callback`;
      const params = new URLSearchParams({
        enable_fb_login: '0',
        force_authentication: '1',
        client_id: igAppId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'instagram_business_basic,instagram_business_manage_comments',
        state: clientId,
      });
      window.location.href = `https://www.instagram.com/oauth/authorize?${params.toString()}`;
    } catch (err) {
      setError(err.message);
      setIgBusy(false);
    }
  }

  const steps = [
    {
      title: `Welcome, ${clientName} 👋`,
      body: (
        <p className="max-w-md text-slate-500 dark:text-slate-400">
          Let&apos;s connect your Facebook Page so we can start moderating comments automatically. This takes about
          five minutes, and only needs to be done once.
        </p>
      ),
      nextLabel: 'Get started',
    },
    {
      title: 'Step 1 — Get added as a tester',
      body: (
        <div className="max-w-lg space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Our app isn&apos;t public on Facebook yet, so before you can generate a token you need to be added as a{' '}
            <strong>Tester</strong> on it. It&apos;s a one-time, 30-second step on our side — no passwords or tokens
            involved.
          </p>
          <ol className="list-decimal space-y-1.5 pl-4 text-sm text-slate-500 dark:text-slate-400">
            <li>Send us the email or Facebook profile link for the account you use to manage your Page.</li>
            <li>Also want Instagram comments moderated? Say so in the same message — Instagram uses a separate tester list from Facebook, so we need to add you to both.</li>
            <li>We&apos;ll add you as a tester — takes a few minutes.</li>
            <li>
              You&apos;ll get a notification to accept the invite — from Facebook for the Page, and from the
              Instagram app itself (Settings → Apps and websites → Tester invites) if you asked for Instagram too.
              Accept it, then come back here.
            </li>
          </ol>
          <a
            href={`mailto:hello@techermanos.org?subject=${encodeURIComponent(`Tester access request — ${clientName}`)}&body=${encodeURIComponent(`Hi,\n\nPlease add me as a tester on your Facebook App so I can generate my Page access token.\n\nName: ${clientName}\nAccount email: ${clientEmail || ''}\nFacebook profile link: \n\nThanks!`)}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Mail size={16} /> Request tester access
          </a>
        </div>
      ),
      nextLabel: "I've accepted the invite",
    },
    {
      title: 'Step 2 — Generate an access token',
      body: (
        <div className="max-w-lg space-y-4">
          <a
            href="https://developers.facebook.com/tools/explorer"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400"
          >
            Open Graph API Explorer <ExternalLink size={14} />
          </a>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Select your app, then check these permissions before generating a User Access Token:
          </p>
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {SCOPES.map((s) => (
              <li key={s} className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs dark:bg-slate-800">{s}</li>
            ))}
          </ul>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Click <strong>Generate Access Token</strong> and approve the permissions popup.
          </p>
        </div>
      ),
      nextLabel: 'Next',
    },
    {
      title: 'Step 3 — Get your Page Access Token',
      body: (
        <div className="max-w-lg space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Using the token from the previous step, call:
          </p>
          <CodeBlock>{'GET /me/accounts?access_token=<your-user-token>'}</CodeBlock>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This returns every Page you manage. Find yours in the list and copy its <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">access_token</code> value
            — that&apos;s your <strong>Page</strong> Access Token, not the user token above. Keep it handy for the last step.
          </p>
        </div>
      ),
      nextLabel: 'Next',
    },
    {
      title: 'Step 4 — Subscribe your Page',
      body: (
        <div className="max-w-lg space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Run this once from a terminal, replacing the placeholders with your Page ID and the Page Access Token
            from the last step:
          </p>
          <CodeBlock>{'curl -X POST "https://graph.facebook.com/v19.0/<PAGE_ID>/subscribed_apps?subscribed_fields=feed&access_token=<PAGE_ACCESS_TOKEN>"'}</CodeBlock>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You should get back <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{'{"success":true}'}</code>. This tells Facebook to actually send us your Page&apos;s comments.
          </p>
        </div>
      ),
      nextLabel: 'Next',
    },
    {
      title: 'Step 5 — Connect it here',
      body: (
        <div className="max-w-lg space-y-3">
          <Field label="Facebook Page ID" value={form.pageId} onChange={set('pageId')} placeholder="106480395512492" />
          <Field label="Page Access Token" value={form.pageAccessToken} onChange={set('pageAccessToken')} placeholder="EAAW..." />

          {igAppId && (
            <>
              <hr className="my-1 border-slate-200 dark:border-slate-800" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Optional — want Instagram comments moderated too? Requires having accepted the Instagram tester
                invite from Step 1 first. This saves your Facebook details above, then takes you to Instagram to
                finish connecting.
              </p>
              <button
                type="button"
                disabled={igBusy}
                onClick={connectInstagram}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold hover:border-brand-400 disabled:opacity-50 dark:border-slate-700"
              >
                {igBusy ? 'Redirecting…' : 'Connect Instagram'}
              </button>
            </>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      ),
      nextLabel: busy ? 'Saving…' : 'Finish & go to dashboard',
      isLast: true,
      // The whole point of this wizard: don't let them reach the
      // dashboard without an actual Page ID + Access Token saved.
      requiresFields: true,
    },
  ];

  const current = steps[step];
  const canProceed = !current.requiresFields || (form.pageId.trim() && form.pageAccessToken.trim());

  function handleNext() {
    if (!canProceed) return;
    if (current.isLast) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo height={30} />
        <div className="flex items-center gap-4">
          <a
            href={`tel:${SUPPORT_PHONE}`}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
          >
            <Phone size={14} /> Stuck? Call {SUPPORT_PHONE}
          </a>
          <ThemeToggle />
        </div>
      </header>

      <div className="mb-8 flex justify-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-10 rounded-full transition-colors ${
              i <= step ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
        ))}
      </div>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center sm:px-10">
        <h1 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">{current.title}</h1>
        <div className="text-left">{current.body}</div>

        <div className="mt-10 flex items-center gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:border-brand-400 dark:border-slate-700"
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <button
            type="button"
            disabled={busy || !canProceed}
            onClick={handleNext}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {current.nextLabel} {!current.isLast && <ArrowRight size={16} />}
          </button>
        </div>
        {current.requiresFields && !canProceed && (
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
            Enter your Facebook Page ID and Page Access Token above to finish — this step can&apos;t be skipped.
          </p>
        )}
      </main>
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
