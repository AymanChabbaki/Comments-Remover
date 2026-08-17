import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-jetbrains-mono',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://comments.techermanos.org';
const DESCRIPTION =
  'AI-powered comment moderation for Facebook Pages and Instagram accounts -- automatically removes spam, ' +
  'toxicity, and negative comments in French, English, Arabic, and Darija.';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  // Each page sets its own short title (e.g. "Log in", "Live demo");
  // this template appends the brand name so every tab still reads as
  // "Tech Hermanos" without every page repeating the same generic string.
  title: { default: 'Tech Hermanos — AI Comment Moderation', template: '%s — Tech Hermanos' },
  description: DESCRIPTION,
  openGraph: {
    siteName: 'Tech Hermanos',
    title: 'Tech Hermanos — AI Comment Moderation',
    description: DESCRIPTION,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Tech Hermanos — AI Comment Moderation',
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-background text-on-surface">{children}</body>
    </html>
  );
}
