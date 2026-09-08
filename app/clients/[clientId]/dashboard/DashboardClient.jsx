'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '../../../../components/AppShell';
import DashboardOverview from '../../../../components/DashboardOverview';

export default function DashboardClient({ clientId, clientName }) {
  const [events, setEvents] = useState([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/clients/${clientId}/events?limit=500`);
    if (res.status === 401) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    const data = await res.json();
    setEvents(data.events || []);
  }, [clientId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <AppShell clientId={clientId} clientName={clientName} subtitle="Overview">
      <DashboardOverview clientId={clientId} events={events} onModerationChange={load} />
    </AppShell>
  );
}
