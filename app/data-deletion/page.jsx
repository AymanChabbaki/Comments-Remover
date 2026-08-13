import Link from 'next/link';
import ThemeToggle from '../../components/ThemeToggle';
import Logo from '../../components/Logo';

export const metadata = {
  title: 'Data Deletion — Comment Moderation',
};

export default function DataDeletionPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center gap-8 bg-slate-50 px-6 py-16 dark:bg-slate-950">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <Logo variant="full" height={44} />

      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold tracking-tight">Data deletion</h1>

        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          For each connected Facebook Page or Instagram professional account, we store the
          Page/Account ID and access token needed to moderate comments, plus a log of comments
          that were reviewed or removed (comment text, author name/ID, platform, and the
          moderation decision) and a blocklist of previously-flagged commenters.
        </p>

        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          To request deletion of this data — whether you&apos;re a connected business account
          or someone whose comment was processed by our moderation system — email us at{' '}
          <a href="mailto:hello@techermanos.org?subject=Data%20deletion%20request" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            hello@techermanos.org
          </a>{' '}
          with the Facebook Page name/ID or Instagram account handle in question. We&apos;ll
          confirm and delete the associated data within 30 days.
        </p>

        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          A connected business can also disconnect their own account at any time from their{' '}
          <span className="font-medium">Settings</span> page, or by removing the app&apos;s
          access directly from their Facebook/Instagram account settings, which immediately
          revokes our stored access token.
        </p>

        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
          ← Back home
        </Link>
      </div>
    </div>
  );
}
