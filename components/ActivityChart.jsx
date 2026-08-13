export default function ActivityChart({ events }) {
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
  const width = 960;
  const height = 90;
  const gap = 3;
  const barW = width / buckets - gap;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 text-sm font-semibold">Activity, last 24h</div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block h-[90px] w-full overflow-visible">
        {counts.map((c, i) => {
          const x = i * (width / buckets) + gap / 2;
          const total = c.deleted + c.kept;
          const scale = (height - 4) / maxCount;
          const keptH = c.kept * scale;
          const delH = c.deleted * scale;
          const hoursAgo = buckets - 1 - i;
          const title = hoursAgo === 0 ? 'This hour' : `${hoursAgo}h ago`;
          if (total === 0) {
            return <rect key={i} x={x} y={height - 2} width={barW} height={2} rx={1} className="fill-slate-200 dark:fill-slate-800" />;
          }
          return (
            <g key={i}>
              <rect x={x} y={height - keptH} width={barW} height={Math.max(keptH, 1)} rx={1} className="fill-emerald-500 hover:opacity-75">
                <title>{`${title}: ${c.kept} kept`}</title>
              </rect>
              <rect x={x} y={height - keptH - delH} width={barW} height={Math.max(delH, delH > 0 ? 1 : 0)} rx={1} className="fill-red-500 hover:opacity-75">
                <title>{`${title}: ${c.deleted} deleted`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      <div className="mt-2.5 flex gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span><span className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-red-500" />Deleted</span>
        <span><span className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-emerald-500" />Kept</span>
      </div>
    </div>
  );
}
