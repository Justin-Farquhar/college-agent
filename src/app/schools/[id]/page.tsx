'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';

type SchoolPageProps = { params: { id: string } };

type School = {
  id: string;
  name: string;
  state: string;
  isPublic: boolean;
  netPrice: number;
  medianDebt: number;
  completionRate: number;
  earlyCareerEarnings: number;
  earningsAt10Yrs: number;
  debtWithInterest10Yrs?: number;
  earningsPremium10Yrs?: number;
  roiSimple?: number | null;
  breakEvenYears?: number | null;
};

export default function SchoolDetailPage({ params }: SchoolPageProps) {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFail(false);
    fetch(`/api/schools?id=${encodeURIComponent(params.id)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setSchool(data);
      })
      .catch(() => {
        if (!cancelled) setFail(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [params.id]);

  if (loading) return <p className="text-sm text-slate-400">Loading school…</p>;
  if (fail || !school) notFound();

  const {
    netPrice,
    medianDebt,
    completionRate,
    earningsAt10Yrs,
    debtWithInterest10Yrs,
    earningsPremium10Yrs,
    breakEvenYears,
  } = school;

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{school.name}</h1>
        <p className="text-sm text-slate-400">
          {school.state} • {school.isPublic ? 'Public' : 'Private'}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card space-y-2">
          <h2 className="text-sm font-semibold text-slate-100">
            Financial snapshot
          </h2>
          <dl className="grid grid-cols-2 gap-2 text-xs text-slate-300">
            <div>
              <dt className="text-slate-500">Avg. net price</dt>
              <dd className="font-medium">
                {netPrice ? `$${netPrice.toLocaleString()}` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Median debt</dt>
              <dd className="font-medium">
                {medianDebt ? `$${medianDebt.toLocaleString()}` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Completion rate</dt>
              <dd className="font-medium">
                {completionRate ? `${completionRate.toFixed(1)}%` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Earnings @10 yrs</dt>
              <dd className="font-medium">
                {earningsAt10Yrs ? `$${earningsAt10Yrs.toLocaleString()}` : '—'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card space-y-2">
          <h2 className="text-sm font-semibold text-slate-100">
            ROI & break-even (pre-computed)
          </h2>
          <p className="text-xs text-slate-300">
            Derived from net price, median debt, and 10-year earnings using
            standard assumptions (4-year completion, 5% simple interest on debt).
          </p>
          <dl className="mt-2 space-y-1 text-xs text-slate-300">
            <div className="flex justify-between">
              <dt className="text-slate-500">Debt over 10 yrs (est.)</dt>
              <dd className="font-medium">
                {debtWithInterest10Yrs != null
                  ? `$${debtWithInterest10Yrs.toLocaleString()}`
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Earnings premium vs cost</dt>
              <dd className="font-medium">
                {earningsPremium10Yrs != null
                  ? `$${earningsPremium10Yrs.toLocaleString()}`
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Break-even (years)</dt>
              <dd className="font-medium">
                {breakEvenYears != null ? `${breakEvenYears} yrs` : '—'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card space-y-2">
          <h2 className="text-sm font-semibold text-slate-100">How to read</h2>
          <ul className="list-disc space-y-1 pl-5 text-xs text-slate-300">
            <li>
              <span className="font-medium">Net price</span> is what students
              typically pay after grants and scholarships.
            </li>
            <li>
              <span className="font-medium">Median debt</span> reflects typical
              borrowing; your path may differ.
            </li>
            <li>
              <span className="font-medium">Earnings</span> come from federal
              tax data and do not capture non-monetary value or career changes.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
