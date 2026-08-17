'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThumbsUp, Camera, Settings as SettingsIcon, CheckCircle2, Plus } from 'lucide-react';
import { CARD } from './dashboardUi';

function Row({ icon: Icon, tone, label, connected, detail, settingsHref }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={16} className="text-white" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-ink">{label}</div>
        <div className="truncate text-xs text-ink-mute">{connected ? detail || 'Connected' : 'Not connected'}</div>
      </div>
      {connected ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-good-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-good">
          <CheckCircle2 size={11} strokeWidth={2.5} /> Live
        </span>
      ) : (
        <Link
          href={settingsHref}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-600 transition-colors hover:bg-brand-100"
        >
          <Plus size={11} strokeWidth={2.5} /> Connect
        </Link>
      )}
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
    <div className={`animate-fade-in-up flex flex-col p-5 ${CARD}`}>
      <div className="flex items-center justify-between border-b border-line-soft pb-3">
        <div className="text-sm font-semibold text-ink">Connected pages</div>
        <Link href={settingsHref} title="Connection settings" className="text-ink-mute transition-colors hover:text-brand-600">
          <SettingsIcon size={15} />
        </Link>
      </div>
      {!status ? (
        <div className="py-10 text-center text-xs text-ink-mute">Loading…</div>
      ) : (
        <div className="divide-y divide-line-soft">
          <Row
            icon={ThumbsUp}
            tone="bg-fb"
            label="Facebook Page"
            connected={fbConnected}
            detail={status.pageId}
            settingsHref={settingsHref}
          />
          <Row
            icon={Camera}
            tone="bg-ig"
            label="Instagram"
            connected={igConnected}
            detail={status.igUsername ? `@${status.igUsername}` : status.igUserId}
            settingsHref={settingsHref}
          />
        </div>
      )}
    </div>
  );
}
