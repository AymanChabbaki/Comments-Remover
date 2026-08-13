'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '../../../../components/AppShell';
import CommentsTable from '../../../../components/CommentsTable';

export default function CommentsClient({ clientId, clientName }) {
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

  async function handleDelete(event) {
    const res = await fetch(`/api/clients/${clientId}/events/${encodeURIComponent(event.commentId)}/delete`, { method: 'POST' });
    const data = await res.json();
    if (!data.success) {
      alert(`Failed to delete: ${data.error || 'unknown error'}`);
      return;
    }
    await load();
  }

  return (
    <AppShell clientId={clientId} clientName={clientName} subtitle="Comments" wide>
      <CommentsTable events={events} onDelete={handleDelete} onRefresh={load} />
    </AppShell>
  );
}
