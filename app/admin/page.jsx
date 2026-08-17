'use client';

import { useEffect, useMemo, useState } from 'react';
import { Users, MessageSquare, Trash2, CheckCircle2, AlertTriangle, Percent, Globe2, Trophy } from 'lucide-react';
import AppShell from '../../components/AppShell';
import StatCard from '../../components/StatCard';
import ActivityChart from '../../components/ActivityChart';
import BarChart from '../../components/BarChart';
import { relativeTime, VerdictBadge, CARD } from '../../components/dashboardUi';

function RecentActivity({ events }) {
  const rows = events.slice(0, 8);
  return (
    <div className={`animate-fade-in-up ${CARD}`}>
      <div className="border-b border-line-soft px-5 py-4 text-sm font-semibold text-ink">Recent activity</div>
      {rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-ink-soft">Nothing moderated yet.</div>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map((e) => (
              <tr key={`${e.clientId}-${e.commentId}`} className="border-t border-line-soft first:border-t-0">
                <td className="whitespace-nowrap px-5 py-2.5 text-xs text-ink-mute">{relativeTime(e.timestamp)}</td>
                <td className="px-2 py-2.5 font-medium text-ink">{e.clientName}</td>
                <td className="max-w-[240px] truncate px-2 py-2.5 text-ink-soft">{e.text}</td>
                <td className="px-5 py-2.5 text-right">
                  <VerdictBadge event={e} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AdminOverviewPage() {
  const [clients, setClients] = useState([]);
  const [overview, setOverview] = useState({ stats: { total: 0, deleted: 0, kept: 0, errors: 0, facebook: 0, instagram: 0 }, recent: [] });

  async function load() {
    const [clientsRes, statsRes] = await Promise.all([
      fetch('/api/admin/clients'),
      fetch('/api/admin/stats'),
    ]);
    const clientsData = await clientsRes.json();
    const statsData = await statsRes.json();
    setClients(clientsData.clients || []);
    setOverview(statsData);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  const clientCount = clients.length;
  const rate = overview.stats.total ? Math.round((overview.stats.deleted / overview.stats.total) * 100) : 0;

  const topClients = useMemo(() => {
    const counts = new Map();
    for (const e of overview.recent) {
      counts.set(e.clientName, (counts.get(e.clientName) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value, colorClass: 'bg-brand-600' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [overview.recent]);

  const platformRows = [
    { label: 'Facebook', value: overview.stats.facebook, colorClass: 'bg-fb' },
    { label: 'Instagram', value: overview.stats.instagram, colorClass: 'bg-ig' },
  ];
  const verdictRows = [
    { label: 'Deleted', value: overview.stats.deleted, colorClass: 'bg-danger' },
    { label: 'Kept', value: overview.stats.kept, colorClass: 'bg-good' },
    { label: 'Errors', value: overview.stats.errors, colorClass: 'bg-warn' },
  ];

  return (
    <AppShell isAdmin subtitle="Every client, at a glance" wide>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Clients" value={clientCount} icon={Users} color="brand" delay={0} />
        <StatCard label="Comments moderated" value={overview.stats.total} icon={MessageSquare} color="neutral" delay={50} />
        <StatCard label="Deleted" value={overview.stats.deleted} icon={Trash2} color="danger" delay={100} />
        <StatCard label="Kept" value={overview.stats.kept} icon={CheckCircle2} color="good" delay={150} />
        <StatCard label="Errors" value={overview.stats.errors} icon={AlertTriangle} color="warn" delay={200} />
        <StatCard label="Delete rate" value={`${rate}%`} icon={Percent} color="neutral" delay={250} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChart events={overview.recent} />
        </div>
        <RecentActivity events={overview.recent} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <BarChart title="Top clients (recent activity)" icon={Trophy} rows={topClients} />
        <BarChart title="Platform split" icon={Globe2} rows={platformRows} />
        <BarChart title="Verdict breakdown" icon={CheckCircle2} rows={verdictRows} />
      </div>
    </AppShell>
  );
}
