'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import ModerationDashboard from '../../components/ModerationDashboard';

const DEMO_POST_URL = 'https://www.facebook.com/share/v/1SSGAhdBS4/';

export default function LiveDemoPage() {
  const [events, setEvents] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [clientName, setClientName] = useState('');
  const [notConfigured, setNotConfigured] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/live-demo');
    if (!res.ok) {
      setNotConfigured(true);
      return;
    }
    const data = await res.json();
    setEvents(data.events || []);
    setBlocked(data.blocked || []);
    setClientName(data.clientName || '');
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  const ctaBanner = (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-300 bg-gradient-to-r from-brand-50 to-rose-50 p-4 text-sm shadow-sm dark:border-brand-500/40 dark:from-brand-500/10 dark:to-rose-500/10">
      <div>
        <strong className="font-semibold">This is our own real, connected Page</strong> — post a comment on{' '}
        <a href={DEMO_POST_URL} target="_blank" rel="noreferrer" className="font-semibold underline">
          this post
        </a>{' '}
        (try something negative) and watch it get moderated here within seconds. This page refreshes automatically.
      </div>
      <a
        href="mailto:hello@techermanos.org?subject=Comment%20moderation%20-%20get%20started"
        className="whitespace-nowrap rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
      >
        Connect your own Page →
      </a>
    </div>
  );

  return (
    <AppShell clientName={clientName || 'Live demo'} subtitle="Real comments, moderated live">
      {notConfigured ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Live demo isn&apos;t set up yet.
        </div>
      ) : (
        <ModerationDashboard events={events} blocked={blocked} onRefresh={load} ctaBanner={ctaBanner} readOnly />
      )}
    </AppShell>
  );
}
