import { CARD } from './dashboardUi';

export default function ActivityChart({ events, title = 'Activity, last 24h' }) {
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
  const total = counts.reduce((sum, c) => sum + c.deleted + c.kept, 0);
  const width = 960;
  const height = 104;
  const gap = 4;
  const barW = width / buckets - gap;

  return (
    <div className={`animate-fade-in-up p-5 ${CARD}`}>
      <div className="mb-4 flex items-baseline justify-between">
        <div className="text-sm font-semibold text-ink">{title}</div>
        <div className="text-xs tabular-nums text-ink-mute">{total} in window</div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block h-[104px] w-full overflow-visible">
        {counts.map((c, i) => {
          const x = i * (width / buckets) + gap / 2;
          const stackTotal = c.deleted + c.kept;
          const scale = (height - 6) / maxCount;
          const keptH = c.kept * scale;
          const delH = c.deleted * scale;
          const hoursAgo = buckets - 1 - i;
          const when = hoursAgo === 0 ? 'This hour' : `${hoursAgo}h ago`;

          if (stackTotal === 0) {
            return <rect key={i} x={x} y={height - 2} width={barW} height={2} rx={1} className="fill-line" />;
          }
          return (
            <g key={i}>
              {c.kept > 0 && (
                <rect x={x} y={height - keptH} width={barW} height={Math.max(keptH, 2)} rx={2} className="fill-good">
                  <title>{`${when}: ${c.kept} kept`}</title>
                </rect>
              )}
              {c.deleted > 0 && (
                // 2px gap between the stacked segments so they read as two values, not one bar.
                <rect x={x} y={height - keptH - delH - (c.kept > 0 ? 2 : 0)} width={barW} height={Math.max(delH, 2)} rx={2} className="fill-danger">
                  <title>{`${when}: ${c.deleted} deleted`}</title>
                </rect>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex items-center gap-4 border-t border-line-soft pt-3 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-danger" />Deleted
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-good" />Kept
        </span>
        <span className="ml-auto text-ink-mute">24h &rarr; now</span>
      </div>
    </div>
  );
}
