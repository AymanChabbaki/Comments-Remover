'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppShell from '../../components/AppShell';
import DashboardOverview from '../../components/DashboardOverview';
import CommentsTable from '../../components/CommentsTable';
import BlocklistPanel from '../../components/BlocklistPanel';

const now = Date.now();
const minutesAgo = (m) => new Date(now - m * 60000).toISOString();

const SAMPLE_EVENTS = [
  { commentId: 'demo-1', timestamp: minutesAgo(4), platform: 'instagram', author: 'aymen_ddos777', text: 'nsaba', verdict: 'DELETE', deleted: true },
  { commentId: 'demo-2', timestamp: minutesAgo(12), platform: 'facebook', author: 'Sara Idrissi', text: 'Bravo pour ce travail, service impeccable comme toujours! 👏', verdict: 'KEEP', deleted: false },
  { commentId: 'demo-3', timestamp: minutesAgo(25), platform: 'instagram', author: 'karim_09', text: 'charika kidayra 3andkoum les prix?', verdict: 'KEEP', deleted: false },
  { commentId: 'demo-4', timestamp: minutesAgo(40), platform: 'facebook', author: 'random_promo22', text: 'idiots buy fake followers cheap link in bio DM me now', verdict: 'DELETE', deleted: true },
  { commentId: 'demo-5', timestamp: minutesAgo(55), platform: 'facebook', author: 'Mehdi B.', text: 'Je ne recommande pas du tout, service horrible et personne ne repond.', verdict: 'DELETE', deleted: true },
  { commentId: 'demo-6', timestamp: minutesAgo(70), platform: 'instagram', author: 'random_promo22', text: 'spam spam buy now cheap followers www.fake-link.com', verdict: 'DELETE', deleted: true, autoBlocked: true },
  { commentId: 'demo-7', timestamp: minutesAgo(95), platform: 'instagram', author: 'nour.ig', text: 'Machallah, superbe qualite ❤️', verdict: 'KEEP', deleted: false },
  { commentId: 'demo-8', timestamp: minutesAgo(130), platform: 'facebook', author: 'Anonymous', text: 'walo had chi, khasrtou lflouss', verdict: 'DELETE', deleted: false },
  { commentId: 'demo-9', timestamp: minutesAgo(200), platform: 'facebook', author: 'Youssef Alami', text: 'Merci pour la reponse rapide, tres pro.', verdict: 'KEEP', deleted: false },
];

const SAMPLE_BLOCKED = [
  { platform: 'instagram', authorId: 'demo-author-1', authorName: 'random_promo22', blockedAt: minutesAgo(40) },
];

export default function DemoPage() {
  const [events, setEvents] = useState(SAMPLE_EVENTS);
  const [blocked, setBlocked] = useState(SAMPLE_BLOCKED);

  // Entirely local mutations -- no backend, nothing persists on reload.
  // This exists so a prospective client can see and click around in the
  // real dashboard UI before handing over any Facebook/Instagram access.
  async function handleDelete(event) {
    setEvents((prev) => prev.map((e) => (e.commentId === event.commentId ? { ...e, deleted: true, verdict: 'DELETE' } : e)));
  }

  async function handleUnblock(entry) {
    setBlocked((prev) => prev.filter((b) => b.authorId !== entry.authorId));
  }

  const ctaBanner = (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-300 bg-gradient-to-r from-brand-50 to-rose-50 p-4 text-sm shadow-[0_1px_2px_rgba(31,36,44,0.04)]">
      <div>
        <strong className="font-semibold">This is a live interactive demo</strong> — sample data, nothing connected.
        Click &ldquo;Delete&rdquo; or &ldquo;Unblock&rdquo; below, it&apos;s fully interactive.
      </div>
      <Link
        href="mailto:hello@techermanos.org?subject=Comment%20moderation%20-%20get%20started"
        className="whitespace-nowrap rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
      >
        Get started with your Page →
      </Link>
    </div>
  );

  return (
    <AppShell clientName="Sample Business" subtitle="Comment Moderation · Facebook & Instagram">
      <DashboardOverview events={events} ctaBanner={ctaBanner} />
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CommentsTable events={events} onDelete={handleDelete} />
        </div>
        <BlocklistPanel blocked={blocked} onUnblock={handleUnblock} compact />
      </div>
    </AppShell>
  );
}
