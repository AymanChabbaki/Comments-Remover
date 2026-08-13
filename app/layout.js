import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

const grotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-grotesk',
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

// Runs before React hydrates so there's no flash of the wrong theme.
const THEME_INIT = `
  (function () {
    var saved = localStorage.getItem('theme');
    var dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${grotesk.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
