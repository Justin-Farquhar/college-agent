'use client';

import { getDb } from '@/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function ShortlistPage() {
  const db = getDb();
  const { user, isLoading: authLoading } = db.useAuth();

  if (!authLoading && !user) {
    redirect('/login');
  }

  const { data, isLoading, error } = db.useQuery({
    saved_schools: {
      where: { userId: user?.id ?? '' },
      with: {
        school: {
          fields: ['name', 'state', 'isPublic', 'netPrice', 'earningsAt10Yrs'],
        },
      },
    },
    comparisons: {
      where: { userId: user?.id ?? '' },
    },
  });

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Your shortlist</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Saved schools and comparisons tied to your email. Use this as a
          working list to reflect, share, and revisit.
        </p>
      </section>

      {(authLoading || isLoading) && (
        <p className="text-sm text-slate-400">Loading your shortlist…</p>
      )}
      {error && (
        <p className="text-sm text-red-400">
          Something went wrong loading your data.
        </p>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Saved schools
          </h2>
          <ul className="space-y-2 text-xs text-slate-200">
            {data?.saved_schools?.map((item: any) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/60 px-3 py-2"
              >
                <div>
                  <Link
                    href={`/schools/${item.schoolId}`}
                    className="font-medium hover:text-brand-light"
                  >
                    {item.school?.name}
                  </Link>
                  <p className="text-[11px] text-slate-400">
                    {item.school?.state} •{' '}
                    {item.school?.isPublic ? 'Public' : 'Private'} • Net price:{' '}
                    {item.school?.netPrice
                      ? `$${item.school.netPrice.toLocaleString()}`
                      : '—'}
                  </p>
                </div>
                <Link
                  href={`/compare?schools=${item.schoolId}`}
                  className="text-[11px] text-brand-light hover:underline"
                >
                  Compare
                </Link>
              </li>
            ))}
            {(!data || data.saved_schools?.length === 0) && (
              <li className="text-xs text-slate-400">
                You haven&apos;t saved any schools yet. Use &quot;Save to
                shortlist&quot; on a school card to add one.
              </li>
            )}
          </ul>
        </div>

        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Saved comparisons
          </h2>
          <ul className="space-y-2 text-xs text-slate-200">
            {data?.comparisons?.map((comp: any) => (
              <li
                key={comp.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/60 px-3 py-2"
              >
                <div>
                  <p className="font-medium">{comp.name}</p>
                  {comp.notes && (
                    <p className="text-[11px] text-slate-400">{comp.notes}</p>
                  )}
                </div>
                <button
                  className="text-[11px] text-slate-400 hover:text-brand-light"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `${window.location.origin}/compare?id=${comp.id}`,
                    )
                  }
                >
                  Copy link
                </button>
              </li>
            ))}
            {(!data || data.comparisons?.length === 0) && (
              <li className="text-xs text-slate-400">
                You haven&apos;t saved any comparisons yet. From the compare
                page, you&apos;ll be able to save naming and notes here.
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

