'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '../../../../components/AppShell';
import BlocklistPanel from '../../../../components/BlocklistPanel';

export default function BlacklistClient({ clientId, clientName }) {
  const [blocked, setBlocked] = useState([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/clients/${clientId}/blocklist`);
    if (res.status === 401) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    const data = await res.json();
    setBlocked(data.blocked || []);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUnblock(entry) {
    await fetch(`/api/clients/${clientId}/blocklist/unblock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: entry.platform, authorId: entry.authorId }),
    });
    await load();
  }

  return (
    <AppShell clientId={clientId} clientName={clientName} subtitle="Blocked authors">
      <BlocklistPanel blocked={blocked} onUnblock={handleUnblock} />
    </AppShell>
  );
}
