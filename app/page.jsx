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
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Logo height={34} />
        <Link
          href="/login"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
        >
          Log in
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="animate-fade-in-up border-b border-surface-container-high py-16 sm:py-24">
          <span className="inline-block rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
            Facebook &amp; Instagram
          </span>
          <h1 className="mt-5 max-w-2xl text-[40px] font-bold leading-[1.1] text-on-surface sm:text-[52px]">
            Keep your comments clean, without reading every one.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-on-surface-variant">
            AI moderation that removes spam, insults, and negative comments from your Page and Instagram account
            automatically — so your posts stay somewhere people want to buy from.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-sm shadow-primary/20 transition-all hover:bg-primary-container active:scale-[0.98]"
            >
              Try the demo <ArrowRight size={15} />
            </Link>
            <Link
              href="/live-demo"
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-6 py-3 text-sm font-semibold text-on-surface transition-colors hover:border-primary/40 hover:text-primary"
            >
              Watch it work live
            </Link>
          </div>
        </section>

        <section className="grid gap-10 py-16 sm:grid-cols-3 sm:gap-8">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <div key={title} style={{ animationDelay: `${i * 80}ms` }} className="animate-fade-in-up">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Icon size={18} className="text-primary-fixed-dim" strokeWidth={2.25} />
              </span>
              <h2 className="mt-4 text-base font-bold text-on-surface">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-surface-container-high">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-7 text-xs text-on-surface-variant">
          <span>Tech Hermanos · Digital Agency</span>
          <Link href="/data-deletion" className="transition-colors hover:text-primary">
            Data deletion
          </Link>
        </div>
      </footer>
    </div>
  );
}
