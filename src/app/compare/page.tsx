'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type School = {
  id: string;
  name: string;
  state: string;
  isPublic: boolean;
  netPrice: number;
  medianDebt: number;
  completionRate: number;
  earningsAt10Yrs: number;
  debtWithInterest10Yrs?: number;
  earningsPremium10Yrs?: number;
};

export default function ComparePage() {
  const searchParams = useSearchParams();
  const schoolIds = searchParams.get('schools')?.split(',').filter(Boolean) ?? [];
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (schoolIds.length === 0) {
      setSchools([]);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all(
      schoolIds.map((id) =>
        fetch(`/api/schools?id=${encodeURIComponent(id)}`).then((r) => {
          if (!r.ok) throw new Error('Not found');
          return r.json();
        })
      )
    )
      .then(setSchools)
      .catch(() => setError('Could not load one or more schools.'))
      .finally(() => setLoading(false));
  }, [schoolIds.join(',')]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Compare colleges side by side
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Select 2–4 schools from search results (click Compare on a card) and
            compare net price, debt, completion, earnings, and derived ROI.
          </p>
        </div>
      </section>

      {schoolIds.length === 0 && (
        <p className="text-sm text-slate-400">
          Add schools from the home page: search, then click &quot;Compare&quot; on a
          school card to add it to the comparison URL.
        </p>
      )}

      {loading && schoolIds.length > 0 && (
        <p className="text-sm text-slate-400">Loading schools…</p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && schools.length > 0 && (
        <section className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-400">
                  Metric
                </th>
                {schools.map((s) => (
                  <th
                    key={s.id}
                    className="px-3 py-2 text-left font-medium text-slate-100"
                  >
                    <a href={`/schools/${s.id}`} className="hover:underline">
                      {s.name}
                    </a>
                    <div className="text-[10px] text-slate-500">
                      {s.state} • {s.isPublic ? 'Public' : 'Private'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/40">
              <tr>
                <td className="px-3 py-2 text-slate-400">Avg. net price</td>
                {schools.map((s) => (
                  <td key={s.id} className="px-3 py-2 font-medium">
                    {s.netPrice ? `$${s.netPrice.toLocaleString()}` : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-slate-400">Median debt</td>
                {schools.map((s) => (
                  <td key={s.id} className="px-3 py-2 font-medium">
                    {s.medianDebt ? `$${s.medianDebt.toLocaleString()}` : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-slate-400">
                  Debt over 10 yrs (est.)
                </td>
                {schools.map((s) => (
                  <td key={s.id} className="px-3 py-2 font-medium">
                    {s.debtWithInterest10Yrs != null
                      ? `$${s.debtWithInterest10Yrs.toLocaleString()}`
                      : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-slate-400">Completion rate</td>
                {schools.map((s) => (
                  <td key={s.id} className="px-3 py-2 font-medium">
                    {s.completionRate != null
                      ? `${s.completionRate.toFixed(1)}%`
                      : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-slate-400">
                  Earnings @10 yrs
                </td>
                {schools.map((s) => (
                  <td key={s.id} className="px-3 py-2 font-medium">
                    {s.earningsAt10Yrs
                      ? `$${s.earningsAt10Yrs.toLocaleString()}`
                      : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-slate-400">
                  Earnings premium vs cost
                </td>
                {schools.map((s) => (
                  <td key={s.id} className="px-3 py-2 font-medium">
                    {s.earningsPremium10Yrs != null
                      ? `$${s.earningsPremium10Yrs.toLocaleString()}`
                      : '—'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
