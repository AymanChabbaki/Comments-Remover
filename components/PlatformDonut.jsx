import { CARD } from './dashboardUi';

/**
 * Facebook/Instagram split as a real SVG ring (stroke-dasharray arcs),
 * not the reference mockup's border-radius approximation -- that trick
 * only ever renders a visually-plausible 50/50, it can't represent an
 * actual proportion.
 */
export default function PlatformDonut({ facebook, instagram }) {
  const total = facebook + instagram;
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const fbFrac = total ? facebook / total : 0;
  const fbLen = fbFrac * circumference;
  const igLen = circumference - fbLen;

  return (
    <section className={`p-6 ${CARD}`}>
      <h2 className="mb-6 text-headline-md text-on-surface">Platform Distribution</h2>
      <div className="flex items-center justify-between gap-4">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-surface-container-high)" strokeWidth="12" />
            {total > 0 && (
              <>
                <circle
                  cx="50" cy="50" r={r} fill="none" stroke="var(--color-fb)" strokeWidth="12"
                  strokeDasharray={`${fbLen} ${circumference - fbLen}`} strokeLinecap="round"
                />
                <circle
                  cx="50" cy="50" r={r} fill="none" stroke="var(--color-ig)" strokeWidth="12"
                  strokeDasharray={`${igLen} ${circumference - igLen}`} strokeDashoffset={-fbLen} strokeLinecap="round"
                />
              </>
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-xl font-bold text-on-surface">{total}</div>
            <div className="font-mono text-label-sm uppercase text-on-surface-variant">Comments</div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 shrink-0 rounded-full bg-fb" />
            <div>
              <div className="text-sm font-semibold text-on-surface">Facebook</div>
              <div className="text-body-md text-xs text-on-surface-variant">
                {facebook} ({total ? Math.round(fbFrac * 100) : 0}%)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 shrink-0 rounded-full bg-ig" />
            <div>
              <div className="text-sm font-semibold text-on-surface">Instagram</div>
              <div className="text-body-md text-xs text-on-surface-variant">
                {instagram} ({total ? 100 - Math.round(fbFrac * 100) : 0}%)
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
