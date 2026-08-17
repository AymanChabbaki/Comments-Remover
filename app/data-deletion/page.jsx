import Link from 'next/link';
import Logo from '../../components/Logo';

export const metadata = {
  title: 'Data Deletion',
  description: 'How to request deletion of your Facebook or Instagram data connected through Tech Hermanos.',
  alternates: { canonical: '/data-deletion' },
};

export default function DataDeletionPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center gap-8 bg-background px-6 py-16">
      <Logo variant="full" height={44} />

      <div className="w-full max-w-xl rounded-xl border border-surface-container-high bg-surface-container-lowest p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <h1 className="text-2xl font-bold tracking-tight">Data deletion</h1>

        <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
          For each connected Facebook Page or Instagram professional account, we store the
          Page/Account ID and access token needed to moderate comments, plus a log of comments
          that were reviewed or removed (comment text, author name/ID, platform, and the
          moderation decision) and a blocklist of previously-flagged commenters.
        </p>

        <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
          To request deletion of this data — whether you&apos;re a connected business account
          or someone whose comment was processed by our moderation system — email us at{' '}
          <a href="mailto:hello@techermanos.org?subject=Data%20deletion%20request" className="font-semibold text-primary hover:underline">
            hello@techermanos.org
          </a>{' '}
          with the Facebook Page name/ID or Instagram account handle in question. We&apos;ll
          confirm and delete the associated data within 30 days.
        </p>

        <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
          A connected business can also disconnect their own account at any time from their{' '}
          <span className="font-medium">Settings</span> page, or by removing the app&apos;s
          access directly from their Facebook/Instagram account settings, which immediately
          revokes our stored access token.
        </p>

        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
          ← Back home
        </Link>
      </div>
    </div>
  );
}
