'use client';

import Link from 'next/link';
import { getDb } from '@/lib/db';

export function NavBar() {
  const db = getDb();
  const { user, isLoading } = db.useAuth();

  return (
    <header className="border-b border-neon-dim/20 bg-night/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neon-dim/40 bg-neon-dim/20 text-sm font-bold text-neon">
            CA
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-chalk">
              College Agent
            </span>
            <span className="text-[11px] text-neon/70">
              Price · Debt · Outcomes
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/compare"
            className="text-chalk/70 transition-colors duration-150 hover:text-chalk"
          >
            Compare
          </Link>
          <Link
            href="/shortlist"
            className="text-chalk/70 transition-colors duration-150 hover:text-chalk"
          >
            Saved work
          </Link>
          {isLoading ? (
            <span className="text-xs text-neon/50">Checking login…</span>
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-neon/60 sm:inline">
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
