'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThumbsUp, Camera, Settings as SettingsIcon, CheckCircle2, CircleDashed } from 'lucide-react';

function Row({ icon: Icon, iconColor, label, connected, detail, settingsHref }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
        <Icon size={17} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="truncate text-xs text-slate-500 dark:text-slate-400">
          {connected ? (detail || 'Connected') : 'Not connected'}
        </div>
      </div>
      {connected ? (
        <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
      ) : (
        <Link href={settingsHref} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
          <CircleDashed size={13} /> Connect
        </Link>
      )}
    </div>
  );
}

/**
 * "Connected pages" summary for the Dashboard overview -- lets a client
 * see at a glance whether their Facebook Page / Instagram account are
 * actually wired up, without having to visit Settings.
 */
export default function AccountStatusCard({ clientId }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch(`/api/clients/${clientId}/settings`)
      .then((res) => res.json())
      .then(setStatus);
  }, [clientId]);

  const settingsHref = `/clients/${clientId}/settings`;
  const fbConnected = !!(status?.pageId && status?.hasPageToken);
  const igConnected = !!(status?.igUserId && status?.hasIgToken);

  return (
    <div className="animate-fade-in-up flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Connected pages</div>
        <Link href={settingsHref} className="text-slate-400 transition-colors hover:text-brand-600 dark:hover:text-brand-400">
          <SettingsIcon size={15} />
        </Link>
      </div>
      {!status ? (
        <div className="py-6 text-center text-xs text-slate-400">Loading…</div>
      ) : (
        <div className="flex flex-col gap-2">
          <Row
            icon={ThumbsUp}
            iconColor="bg-blue-600"
            label="Facebook Page"
            connected={fbConnected}
            detail={status.pageId}
            settingsHref={settingsHref}
          />
          <Row
            icon={Camera}
            iconColor="bg-gradient-to-br from-fuchsia-500 to-amber-400"
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
