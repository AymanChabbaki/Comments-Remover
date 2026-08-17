'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../../../components/AppShell';

export default function SettingsClient({ clientId, clientName, igAppId, fbAppId, fbConfigId }) {
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({ pageId: '', pageAccessToken: '', igUserId: '', igAccessToken: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [igResult, setIgResult] = useState(null);
  const [igReason, setIgReason] = useState(null);
  const [showManualIg, setShowManualIg] = useState(false);
  const [fbResult, setFbResult] = useState(null);
  const [fbReason, setFbReason] = useState(null);
  const [showManualFb, setShowManualFb] = useState(false);

  async function load() {
    const res = await fetch(`/api/clients/${clientId}/settings`);
    const data = await res.json();
    setStatus(data);
    setForm((f) => ({ ...f, pageId: data.pageId || '', igUserId: data.igUserId || '' }));
  }

  useEffect(() => {
    load();
    const params = new URLSearchParams(window.location.search);
    const ig = params.get('ig');
    if (ig) {
      setIgResult(ig);
      setIgReason(params.get('ig_reason'));
      window.history.replaceState({}, '', window.location.pathname);
    }
    const fb = params.get('fb');
    if (fb) {
      setFbResult(fb);
      setFbReason(params.get('fb_reason'));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  function connectInstagram() {
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
  }

  function connectFacebook() {
    const redirectUri = `${window.location.origin}/api/oauth/facebook/callback`;
    const params = new URLSearchParams({
      client_id: fbAppId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state: clientId,
    });
    // A Configuration (config_id) is the flow Meta documents for Pages
    // owned by a Business Portfolio -- a plain scope= list left /me/accounts
    // empty even with every permission granted. Falls back to scope= if no
    // Configuration has been set up yet.
    if (fbConfigId) {
      params.set('config_id', fbConfigId);
    } else {
      params.set('scope', 'pages_show_list,pages_read_engagement,pages_manage_engagement,pages_read_user_content,pages_manage_metadata');
    }
    window.location.href = `https://www.facebook.com/dialog/oauth?${params.toString()}`;
  }

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
    <AppShell clientId={clientId} clientName={clientName} subtitle="Connection Settings">
      <div className="max-w-lg">
        {status && (
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <StatusPill label="Facebook Page" connected={!!status.pageId && status.hasPageToken} />
            <StatusPill label="Instagram" connected={!!status.igUserId && status.hasIgToken} optional />
            {status.igUserId && status.hasIgToken && status.igUsername && (
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                {status.igProfilePicUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={status.igProfilePicUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                )}
                @{status.igUsername}
              </span>
            )}
          </div>
        )}

        {igResult === 'connected' && (
          <div className="mb-4 rounded-lg border border-good/40 bg-good-soft px-3 py-2.5 text-sm text-good">
            Instagram connected.
          </div>
        )}
        {igResult === 'connected_no_webhook' && (
          <div className="mb-4 rounded-lg border border-warn/40 bg-warn-soft px-3 py-2.5 text-sm text-warn">
            Instagram account saved, but comment moderation isn&apos;t active yet — subscribing to webhooks failed.
            Try reconnecting, or check the account&apos;s &quot;Abonnement Webhooks&quot; toggle in App Dashboard.
            {igReason && <div className="mt-1 break-words font-mono text-xs opacity-80">{igReason}</div>}
          </div>
        )}
        {igResult === 'denied' && (
          <div className="mb-4 rounded-lg border border-warn/40 bg-warn-soft px-3 py-2.5 text-sm text-warn">
            Instagram connection was cancelled — nothing changed.
          </div>
        )}
        {igResult === 'error' && (
          <div className="mb-4 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2.5 text-sm text-danger">
            Instagram connection failed. Make sure you&apos;ve accepted the Instagram tester invite, then try again.
            {igReason && <div className="mt-1 break-words font-mono text-xs opacity-80">{igReason}</div>}
          </div>
        )}

        {fbResult === 'connected' && (
          <div className="mb-4 rounded-lg border border-good/40 bg-good-soft px-3 py-2.5 text-sm text-good">
            Facebook Page connected.
          </div>
        )}
        {fbResult === 'connected_no_webhook' && (
          <div className="mb-4 rounded-lg border border-warn/40 bg-warn-soft px-3 py-2.5 text-sm text-warn">
            Facebook Page saved, but comment moderation isn&apos;t active yet — subscribing to webhooks failed. Try
            reconnecting, or re-run the manual subscribe command from the README.
            {fbReason && <div className="mt-1 break-words font-mono text-xs opacity-80">{fbReason}</div>}
          </div>
        )}
        {fbResult === 'denied' && (
          <div className="mb-4 rounded-lg border border-warn/40 bg-warn-soft px-3 py-2.5 text-sm text-warn">
            Facebook connection was cancelled — nothing changed.
          </div>
        )}
        {fbResult === 'error' && (
          <div className="mb-4 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2.5 text-sm text-danger">
            Facebook connection failed. Make sure you&apos;ve accepted the Facebook tester invite, then try again.
            {fbReason && <div className="mt-1 break-words font-mono text-xs opacity-80">{fbReason}</div>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(31,36,44,0.04)]">
          {fbAppId && !showManualFb ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={connectFacebook}
                className="rounded-lg border border-line bg-surface py-2.5 text-sm font-semibold hover:border-brand-400"
              >
                Connect Facebook
              </button>
              <button
                type="button"
                onClick={() => setShowManualFb(true)}
                className="self-start text-xs text-ink-mute hover:text-ink-soft"
              >
                Have a token already? Paste it manually
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-ink-soft">
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
              {fbAppId && (
                <button
                  type="button"
                  onClick={() => setShowManualFb(false)}
                  className="self-start text-xs text-ink-mute hover:text-ink-soft"
                >
                  Use Connect Facebook instead
                </button>
              )}
            </>
          )}
          <hr className="my-1 border-line" />
          <p className="text-xs text-ink-soft">Optional — only if you also want Instagram comments moderated.</p>

          {igAppId && !showManualIg ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={connectInstagram}
                className="rounded-lg border border-line bg-surface py-2.5 text-sm font-semibold hover:border-brand-400"
              >
                Connect Instagram
              </button>
              <button
                type="button"
                onClick={() => setShowManualIg(true)}
                className="self-start text-xs text-ink-mute hover:text-ink-soft"
              >
                Have a token already? Paste it manually
              </button>
            </div>
          ) : (
            <>
              <Field label="Instagram Account ID" value={form.igUserId} onChange={set('igUserId')} placeholder="17841454947560776" />
              <Field
                label={`Instagram Access Token${status?.hasIgToken ? ' (already set — leave blank to keep it)' : ''}`}
                value={form.igAccessToken}
                onChange={set('igAccessToken')}
                placeholder="IGAA..."
              />
              {igAppId && (
                <button
                  type="button"
                  onClick={() => setShowManualIg(false)}
                  className="self-start text-xs text-ink-mute hover:text-ink-soft"
                >
                  Use Connect Instagram instead
                </button>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
          {msg && (
            <p className={`text-sm ${msg.ok ? 'text-good' : 'text-danger'}`}>
              {msg.text}
            </p>
          )}
        </form>
      </div>
    </AppShell>
  );
}

function StatusPill({ label, connected, optional }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        connected
          ? 'bg-good-soft text-good'
          : 'bg-paper-alt text-ink-soft'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}: {connected ? 'Connected' : optional ? 'Not connected (optional)' : 'Not connected'}
    </span>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-ink-soft">
      {label}
      <input
        {...props}
        className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
      />
    </label>
  );
}
