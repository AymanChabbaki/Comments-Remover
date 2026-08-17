import { CARD } from './dashboardUi';

export default function ActivityChart({ events, title = 'Activity Volume', subtitle = 'Comments processed over the last 24 hours' }) {
  const buckets = 24;
  const now = Date.now();
  const hourMs = 3600 * 1000;
  const counts = Array.from({ length: buckets }, () => ({ deleted: 0, kept: 0 }));

  for (const e of events) {
    const age = now - new Date(e.timestamp).getTime();
    const bucket = buckets - 1 - Math.floor(age / hourMs);
    if (bucket < 0 || bucket >= buckets) continue;
    if (e.deleted) counts[bucket].deleted++;
    else if (e.verdict === 'KEEP') counts[bucket].kept++;
  }

  const maxCount = Math.max(1, ...counts.map((c) => c.deleted + c.kept));

  return (
    <section className={`flex flex-col overflow-hidden ${CARD}`}>
      <div className="flex items-center justify-between border-b border-surface-container-high bg-surface-container-lowest p-6">
        <div>
          <h2 className="text-headline-md text-on-surface">{title}</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">{subtitle}</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-gradient-to-t from-primary to-primary-fixed" />
            <span className="font-mono text-label-sm uppercase text-on-surface-variant">Deleted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-gradient-to-t from-good to-good-soft" />
            <span className="font-mono text-label-sm uppercase text-on-surface-variant">Kept</span>
          </div>
        </div>
      </div>

      <div className="relative h-64 w-full bg-surface-container-lowest p-6">
        <div className="relative flex h-full items-end justify-between gap-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between border-t border-surface-container-high/50">
            <div className="h-0 w-full border-b border-surface-container-high/30" />
            <div className="h-0 w-full border-b border-surface-container-high/30" />
            <div className="h-0 w-full border-b border-surface-container-high/30" />
            <div className="h-0 w-full border-b border-surface-container-high" />
          </div>

          {counts.map((c, i) => {
            const hoursAgo = buckets - 1 - i;
            const when = hoursAgo === 0 ? 'This hour' : `${hoursAgo}h ago`;
            const keptPct = (c.kept / maxCount) * 100;
            const delPct = (c.deleted / maxCount) * 100;
            return (
              <div key={i} title={`${when}: ${c.kept} kept, ${c.deleted} deleted`} className="group relative z-10 flex h-full flex-1 flex-col justify-end gap-0.5">
                {c.deleted > 0 && (
                  <div
                    style={{ height: `${Math.max(delPct, 3)}%` }}
                    className="w-full rounded-t-sm bg-gradient-to-t from-primary to-primary-fixed-dim shadow-sm transition-opacity group-hover:opacity-80"
                  />
                )}
                {c.kept > 0 && (
                  <div
                    style={{ height: `${Math.max(keptPct, 3)}%` }}
                    className="w-full rounded-t-sm bg-gradient-to-t from-good to-good-soft shadow-sm transition-opacity group-hover:opacity-80"
                  />
                )}
                {c.deleted === 0 && c.kept === 0 && <div className="h-0.5 w-full rounded-full bg-surface-container-high" />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
