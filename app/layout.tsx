import { SlashForward } from 'geist-icons';
import { Ghost } from 'lucide-react';
import type { Metadata } from 'next';
import { Fira_Mono, Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const firaMono = Fira_Mono({
  variable: '--font-fira-mono',
  weight: '400',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Souls.sh',
  description:
    'SOUL.md personality templates for OpenClaw agents. Install them with one command to give your agents identity and purpose.',
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${firaMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-background">
          <div className="flex h-14 items-center justify-between px-4 gap-6">
            <div className="flex items-center gap-2">
              <Link href="/">
                <Ghost width={18} height={18} />
              </Link>
              <SlashForward className="h-4 w-4 text-(--ds-gray-500)" />
              <Link href="/">
                <span className="font-medium tracking-tight text-lg">Souls</span>
              </Link>
            </div>
            <nav className="flex items-baseline gap-4">
              <Link
                href="/docs"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Docs
              </Link>
            </nav>
          </div>
        </nav>

        {/* Main content */}
        <main className="min-h-screen max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">{children}</main>

        {/* Footer */}
        <footer className="border-t border-zinc-800 py-8 mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-gray-500 text-sm text-center">
              Built for{' '}
              <a
                href="https://docs.openclaw.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
              >
                OpenClaw
              </a>{' '}
              AI agents • Inspired by{' '}
              <a
                href="https://skills.sh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
              >
                skills.sh
              </a>
              .
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
