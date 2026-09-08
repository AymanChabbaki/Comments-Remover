'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, PauseCircle } from 'lucide-react';
import { CARD, Switch } from './dashboardUi';

/**
 * The auto-deletion kill switch, on the Dashboard itself -- the same
 * control as the one in Settings, surfaced where a client actually
 * watches moderation happen. Reads and writes the settings endpoint,
 * so both places stay in sync on reload.
 *
 * `onChange` lets the parent react (the dashboard re-polls its events,
 * since pausing changes what shows up in the log).
 */
export default function ModerationToggle({ clientId, onChange }) {
  const [enabled, setEnabled] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/clients/${clientId}/settings`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setEnabled(data.moderationEnabled !== false);
      })
      .catch(() => {
        if (!cancelled) setEnabled(null);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  // Optimistic, then rolled back if the write fails -- a switch that
  // lags a round trip behind reads as broken.
  async function toggle() {
    const next = !enabled;
    setBusy(true);
    setError(null);
    setEnabled(next);
    try {
      const res = await fetch(`/api/clients/${clientId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderationEnabled: next }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Could not save');
      onChange?.(next);
    } catch (err) {
      setEnabled(!next);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (enabled === null) return null;

  const Icon = enabled ? ShieldCheck : PauseCircle;

  return (
    <section className={`flex flex-wrap items-center gap-4 p-5 ${CARD} ${enabled ? '' : 'border-secondary/40'}`}>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          enabled ? 'bg-good-soft text-good' : 'bg-secondary-container text-on-secondary-container'
        }`}
      >
        <Icon size={20} strokeWidth={2.25} />
      </div>
      <div className="min-w-[220px] flex-1">
        <h2 className="text-sm font-semibold text-on-surface">
          Automatic comment deletion{' '}
          <span className={enabled ? 'text-good' : 'text-on-secondary-container'}>{enabled ? 'on' : 'off'}</span>
        </h2>
        <p className="mt-0.5 text-xs text-on-surface-variant">
          {enabled ? (
            'New comments are checked by AI and removed when they break your rules.'
          ) : (
            <>
              Paused — nothing is deleted automatically. New comments are still logged, so you can review and remove
              them yourself on the{' '}
              <Link href={`/clients/${clientId}/comments`} className="text-primary hover:underline">
                Comments page
              </Link>
              .
            </>
          )}
        </p>
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
      </div>
      <Switch checked={enabled} disabled={busy} onChange={toggle} label="Automatic comment deletion" />
    </section>
  );
}
