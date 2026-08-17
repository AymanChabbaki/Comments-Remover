'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThumbsUp, Camera, CheckCircle2, Plus } from 'lucide-react';
import { CARD } from './dashboardUi';

function PageRow({ icon: Icon, tone, name, detail, connected, settingsHref }) {
  return (
    <div className={`group rounded-lg border border-surface-container-high bg-surface-container-lowest p-md transition-colors ${connected ? 'hover:border-primary/30' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
            <Icon size={18} className="text-white" strokeWidth={2.25} />
          </div>
          <div>
            <div className="text-body-md text-sm font-semibold text-on-surface transition-colors group-hover:text-primary">{name}</div>
            <div className="font-mono text-label-sm text-on-surface-variant">{connected ? detail || 'Connected' : 'Not connected'}</div>
          </div>
        </div>
        {connected ? (
          <span className="flex items-center gap-1 rounded-full border border-good/20 bg-good-soft px-2 py-1 font-mono text-label-sm uppercase text-good">
            <CheckCircle2 size={12} strokeWidth={2.5} /> Active
          </span>
        ) : (
          <Link
            href={settingsHref}
            className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 font-mono text-label-sm uppercase text-primary transition-colors hover:bg-primary/15"
          >
            <Plus size={12} strokeWidth={2.5} /> Connect
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * "Connected pages" summary for the Dashboard overview -- lets a client
 * see at a glance whether their Facebook Page / Instagram account are
 * actually wired up, without visiting Settings.
 */
export default function AccountStatusCard({ clientId }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch(`/api/clients/${clientId}/settings`)
      .then((res) => res.json())
      .then(setStatus)
      .catch(() => setStatus({}));
  }, [clientId]);

  const settingsHref = `/clients/${clientId}/settings`;
  const fbConnected = !!(status?.pageId && status?.hasPageToken);
  const igConnected = !!(status?.igUserId && status?.hasIgToken);

  return (
    <section className={`flex flex-1 flex-col ${CARD}`}>
      <div className="flex items-center justify-between border-b border-surface-container-high p-lg">
        <h2 className="text-headline-md text-on-surface">Connected Pages</h2>
        <Link href={settingsHref} className="text-sm font-medium text-primary hover:underline">
          Manage
        </Link>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-lg">
        {!status ? (
          <div className="py-10 text-center text-sm text-on-surface-variant">Loading…</div>
        ) : (
          <>
            <PageRow icon={ThumbsUp} tone="bg-fb" name="Facebook Page" detail={status.pageId} connected={fbConnected} settingsHref={settingsHref} />
            <PageRow
              icon={Camera}
              tone="bg-ig"
              name="Instagram"
              detail={status.igUsername ? `@${status.igUsername}` : status.igUserId}
              connected={igConnected}
              settingsHref={settingsHref}
            />
          </>
        )}
      </div>
    </section>
  );
}
