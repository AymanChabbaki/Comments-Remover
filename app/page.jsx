import Link from 'next/link';
import { ArrowRight, Zap, Globe2, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';

export const metadata = {
  title: 'AI Comment Moderation for Facebook & Instagram',
  description:
    'Automatically remove spam, toxic, and negative comments from your Facebook Page and Instagram account -- ' +
    'try the live interactive demo, no signup required.',
  alternates: { canonical: '/' },
};

const FEATURES = [
  { icon: Zap, title: 'Seconds, not hours', body: 'Every new comment is checked the moment it lands and removed before it does damage.' },
  { icon: Globe2, title: 'Speaks your customers', body: 'French, English, Standard Arabic, and Moroccan Darija — including Arabizi written in Latin script.' },
  { icon: ShieldCheck, title: 'You stay in control', body: 'Connect your Page in one click, review every decision, and revoke access whenever you want.' },
];

export default function LandingPage() {
  return (
    <div className="bg-grain min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Logo height={34} />
        <Link
          href="/login"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:text-brand-600"
        >
          Log in
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="animate-fade-in-up border-b border-line py-16 sm:py-24">
          <span className="inline-block rounded-md bg-brand-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600">
            Facebook &amp; Instagram
          </span>
          <h1 className="font-display mt-5 max-w-2xl text-[40px] font-bold leading-[1.1] text-ink sm:text-[52px]">
            Keep your comments clean, without reading every one.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            AI moderation that removes spam, insults, and negative comments from your Page and Instagram account
            automatically — so your posts stay somewhere people want to buy from.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-700 active:scale-[0.98]"
            >
              Try the demo <ArrowRight size={15} />
            </Link>
            <Link
              href="/live-demo"
              className="rounded-lg border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-brand-400 hover:text-brand-600"
            >
              Watch it work live
            </Link>
          </div>
        </section>

        <section className="grid gap-10 py-16 sm:grid-cols-3 sm:gap-8">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <div key={title} style={{ animationDelay: `${i * 80}ms` }} className="animate-fade-in-up">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900">
                <Icon size={18} className="text-brand-300" strokeWidth={2.25} />
              </span>
              <h2 className="font-display mt-4 text-base font-bold text-ink">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-7 text-xs text-ink-mute">
          <span>Tech Hermanos · Digital Agency</span>
          <Link href="/data-deletion" className="transition-colors hover:text-brand-600">
            Data deletion
          </Link>
        </div>
      </footer>
    </div>
  );
}
