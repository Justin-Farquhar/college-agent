'use client';

import Link from 'next/link';
import { getDb } from '@/lib/db';

export function NavBar() {
  const db = getDb();
  const { user, isLoading } = db.useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-brand/20 text-center text-lg font-semibold text-brand">
            CA
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">
              College Agent
            </span>
            <span className="text-xs text-slate-400">
              Price • Debt • Outcomes
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link href="/compare" className="text-slate-300 hover:text-white">
            Compare
          </Link>
          <Link href="/shortlist" className="text-slate-300 hover:text-white">
            Shortlist
          </Link>
          {isLoading ? (
            <span className="text-xs text-slate-400">Checking login…</span>
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-slate-400 sm:inline">
                {user.email}
              </span>
              <button
                className="btn px-3 py-1 text-xs"
                onClick={() => db.auth.signOut()}
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn px-3 py-1 text-xs">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

