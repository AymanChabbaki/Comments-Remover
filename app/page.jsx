import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-50 px-6 text-center dark:bg-slate-950">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Comment Moderation</h1>
        <p className="mt-3 max-w-md text-slate-500 dark:text-slate-400">
          Automatically remove spam, toxic, and negative comments from your Facebook Page and Instagram account.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/demo" className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold hover:border-blue-400 dark:border-slate-700">
          Try the demo
        </Link>
        <Link href="/signup" className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700">
          Get started
        </Link>
      </div>
    </div>
  );
}
