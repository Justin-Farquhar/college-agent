import type { Metadata } from 'next';
import './globals.css';
import { ReactNode } from 'react';
import { InstantDBProvider } from '@/components/instantdb-provider';
import { NavBar } from '@/components/nav-bar';

export const metadata: Metadata = {
  title: 'College Agent',
  description:
    'Compare colleges using real U.S. College Scorecard data for price, debt, and outcomes.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-night text-chalk">
        <InstantDBProvider>
          <div className="flex min-h-screen flex-col">
            <NavBar />
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-10 pt-6">
              {children}
            </main>
          </div>
        </InstantDBProvider>
      </body>
    </html>
  );
}
