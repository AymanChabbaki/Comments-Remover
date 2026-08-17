'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import DashboardOverview from '../../components/DashboardOverview';
import CommentsTable from '../../components/CommentsTable';
import BlocklistPanel from '../../components/BlocklistPanel';

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
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-300 bg-gradient-to-r from-brand-50 to-rose-50 p-4 text-sm shadow-[0_1px_2px_rgba(31,36,44,0.04)]">
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
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
          Live demo isn&apos;t set up yet.
        </div>
      ) : (
        <>
          <DashboardOverview events={events} ctaBanner={ctaBanner} />
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CommentsTable events={events} onRefresh={load} readOnly />
            </div>
            <BlocklistPanel blocked={blocked} readOnly compact />
          </div>
        </>
      )}
    </AppShell>
  );
}
