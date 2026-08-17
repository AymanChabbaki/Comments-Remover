'use client';

import { useMemo } from 'react';
import { MessageSquare, Trash2, CheckCircle2, AlertTriangle, Percent, Globe2 } from 'lucide-react';
import StatCard from './StatCard';
import ActivityChart from './ActivityChart';
import AccountStatusCard from './AccountStatusCard';

/**
 * Dashboard page content: KPIs, the 24h activity chart, and connected
 * account status. Comments and the blocklist each have their own page.
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
    <div>
      {ctaBanner}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={stats.total} icon={MessageSquare} color="neutral" delay={0} />
        <StatCard label="Deleted" value={stats.deleted} icon={Trash2} color="danger" delay={50} />
        <StatCard label="Kept" value={stats.kept} icon={CheckCircle2} color="good" delay={100} />
        <StatCard label="Errors" value={stats.errors} icon={AlertTriangle} color="warn" delay={150} />
        <StatCard label="Delete rate" value={`${stats.rate}%`} icon={Percent} color="brand" delay={200} />
        <StatCard label="FB / IG" value={`${stats.facebook} / ${stats.instagram}`} icon={Globe2} color="neutral" delay={250} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChart events={events} />
        </div>
        {clientId && <AccountStatusCard clientId={clientId} />}
      </div>
    </div>
  );
}
