import type { Metadata } from 'next';
import { IBM_Plex_Mono, Instrument_Sans } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { themeBootScript } from '@/components/theme/theme';
import './globals.css';

// Approved type pair (style tile, 2026-10-12). Self-hosted by next/font: no requests to Google.
const instrumentSans = Instrument_Sans({
  variable: '--font-instrument-sans',
  subsets: ['latin'],
});

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'BugTrail',
  description: 'Bug reporting and QA tracking panel',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // data-theme is set by the boot script before paint, so React must accept the DOM's value.
    <html
      lang="en"
      data-theme="light"
      className={`${instrumentSans.variable} ${plexMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
