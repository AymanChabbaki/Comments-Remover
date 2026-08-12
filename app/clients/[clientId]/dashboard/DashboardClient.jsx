'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ModerationDashboard from '../../../../components/ModerationDashboard';

export default function DashboardClient({ clientId, clientName }) {
  const [events, setEvents] = useState([]);
  const [blocked, setBlocked] = useState([]);

  const load = useCallback(async () => {
    const [eventsRes, blockedRes] = await Promise.all([
      fetch(`/api/clients/${clientId}/events?limit=500`),
      fetch(`/api/clients/${clientId}/blocklist`),
    ]);
    if (eventsRes.status === 401 || blockedRes.status === 401) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    const eventsData = await eventsRes.json();
    const blockedData = await blockedRes.json();
    setEvents(eventsData.events || []);
    setBlocked(blockedData.blocked || []);
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

  async function handleUnblock(entry) {
    await fetch(`/api/clients/${clientId}/blocklist/unblock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: entry.platform, authorId: entry.authorId }),
    });
    await load();
  }

  return (
    <ModerationDashboard
      title={clientName}
      subtitle="Comment Moderation · Facebook & Instagram"
      events={events}
      blocked={blocked}
      onDelete={handleDelete}
      onUnblock={handleUnblock}
      onRefresh={load}
      headerExtra={
        <Link
          href={`/clients/${clientId}/settings`}
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Settings
        </Link>
      }
    />
  );
}
