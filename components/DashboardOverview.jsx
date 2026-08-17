'use client';

import { useMemo } from 'react';
import { MessageSquare, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import StatCard from './StatCard';
import ActivityChart from './ActivityChart';
import PlatformDonut from './PlatformDonut';
import AccountStatusCard from './AccountStatusCard';

/**
 * Dashboard page content: KPIs, the 24h activity chart, platform split,
 * and connected account status. Comments and the blocklist each have
 * their own page.
 */
export default function DashboardOverview({ clientId, events, ctaBanner }) {
  const stats = useMemo(() => {
    const total = events.length;
    const deleted = events.filter((e) => e.deleted).length;
    const kept = events.filter((e) => e.verdict === 'KEEP').length;
    const errors = events.filter((e) => e.error).length;
    const facebook = events.filter((e) => e.platform === 'facebook').length;
    const instagram = events.filter((e) => e.platform === 'instagram').length;
    const rate = total ? Math.round((deleted / total) * 100) : 0;
    return { total, deleted, kept, errors, facebook, instagram, rate };
  }, [events]);

  return (
    <div className="flex flex-col gap-8">
      {ctaBanner}

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Processed" value={stats.total} icon={MessageSquare} color="neutral" delay={0} />
        <StatCard label="Removed" value={stats.deleted} icon={Trash2} color="brand" delay={50} note={`${stats.rate}% rate`} />
        <StatCard label="Kept" value={stats.kept} icon={CheckCircle2} color="good" delay={100} />
        <StatCard label="Errors" value={stats.errors} icon={AlertTriangle} color="warn" delay={150} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <ActivityChart events={events} />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-4">
          <PlatformDonut facebook={stats.facebook} instagram={stats.instagram} />
          {clientId && <AccountStatusCard clientId={clientId} />}
        </div>
      </div>
    </div>
  );
}
