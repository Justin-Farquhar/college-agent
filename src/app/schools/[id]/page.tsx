'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { id } from '@instantdb/react';
import { InfoTooltip } from '@/components/InfoTooltip';
import { getDb } from '@/lib/db';

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
  const routeParams = useParams<{ id: string }>();
  const schoolIdParam = routeParams?.id ?? params.id;
  const db = getDb();
  const { user } = db.useAuth();
  const { data: savedData } = db.useQuery(
    user
      ? {
          saved_schools: {
            $: {
              where: { userId: user.id },
            },
          },
        }
      : null
  );
  const savedEntryForThisSchool = useMemo(() => {
    if (!schoolIdParam || !savedData?.saved_schools) return null;
    const list = savedData.saved_schools as unknown as { id: string; schoolId: string }[];
    return list.find((s) => String(s.schoolId) === schoolIdParam) ?? null;
  }, [schoolIdParam, savedData?.saved_schools]);

  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [shortlistError, setShortlistError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolIdParam) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`/api/schools?id=${encodeURIComponent(schoolIdParam)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data: School) => {
        if (!cancelled) setSchool(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [schoolIdParam]);

  if (loading) {
    return <p className="text-sm text-slate-400">Loading school…</p>;
  }

  if (error || !school) {
    return (
      <p className="text-sm text-red-400">
        We couldn&apos;t load this school right now. Please go back and try
        again.
      </p>
    );
  }

  const {
    netPrice,
    medianDebt,
    completionRate,
    earningsAt10Yrs,
    debtWithInterest10Yrs,
    earningsPremium10Yrs,
    breakEvenYears,
  } = school;

  const handleSaveToShortlist = () => {
    if (!user) return;
    setShortlistError(null);
    try {
      db.transact(
        db.tx.saved_schools[id()].update({
          userId: user.id,
          schoolId: String(school.id),
        })
      );
    } catch {
      setShortlistError('Couldn’t save. Try again.');
    }
  };

  const handleRemoveFromShortlist = () => {
    const saved = savedEntryForThisSchool as { id: string } | null;
    if (!saved?.id) return;
    setShortlistError(null);
    try {
      db.transact(db.tx.saved_schools[saved.id].delete());
    } catch {
      setShortlistError('Couldn’t remove. Try again.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{school.name}</h1>
        <p className="text-sm text-slate-400">
          {school.state} • {school.isPublic ? 'Public' : 'Private'}
        </p>
      </section>

      {user && (
        <section className="flex flex-wrap items-center gap-3">
          {shortlistError && (
            <p className="text-sm text-red-400">{shortlistError}</p>
          )}
          {savedEntryForThisSchool ? (
            <>
              <span className="text-xs text-slate-400">Saved to your list.</span>
              <button
                type="button"
                onClick={handleRemoveFromShortlist}
                className="text-xs text-slate-300 hover:text-slate-100 hover:underline"
              >
                Remove from saved work
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSaveToShortlist}
              className="btn text-xs"
            >
              Save to saved work
            </button>
          )}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card space-y-2">
          <h2 className="text-sm font-semibold text-slate-100">
            Financial snapshot
          </h2>
          <dl className="grid grid-cols-2 gap-2 text-xs text-slate-300">
            <div>
              <dt className="flex items-center text-slate-500">
                Typical annual net price
                <InfoTooltip label="Typical annual net price explanation">
                  <p className="mb-1">
                    Typical annual net price is what students usually pay out of
                    pocket for one year after grants and scholarships.
                  </p>
                  <p>
                    Roughly:{' '}
                    <span className="font-semibold">
                      sticker price per year – average grants and scholarships
                      per year
                    </span>
                    .
                  </p>
                </InfoTooltip>
              </dt>
              <dd className="font-medium">
                {netPrice ? `$${netPrice.toLocaleString()}` : '—'}
              </dd>
            </div>
            <div>
              <dt className="flex items-center text-slate-500">
                Typical total student debt
                <InfoTooltip label="Typical total student debt explanation">
                  <p className="mb-1">
                    Typical total student debt is the amount a typical graduate
                    owes in student loans at or near graduation.
                  </p>
                  <p>
                    Conceptually it&apos;s the{' '}
                    <span className="font-semibold">
                      median total federal student loan balance at graduation
                    </span>
                    .
                  </p>
                </InfoTooltip>
              </dt>
              <dd className="font-medium">
                {medianDebt ? `$${medianDebt.toLocaleString()}` : '—'}
              </dd>
            </div>
            <div>
              <dt className="flex items-center text-slate-500">
                Completion rate
                <InfoTooltip label="Completion rate explanation">
                  <p className="mb-1">
                    Completion rate is the share of first-time, full-time
                    students who finish a degree here within a standard time
                    window.
                  </p>
                  <p>
                    Roughly:{' '}
                    <span className="font-semibold">
                      completers ÷ cohort size × 100
                    </span>
                    .
                  </p>
                </InfoTooltip>
              </dt>
              <dd className="font-medium">
                {completionRate ? `${completionRate.toFixed(1)}%` : '—'}
              </dd>
            </div>
            <div>
              <dt className="flex items-center text-slate-500">
                Typical annual earnings @10 yrs
                <InfoTooltip label="Typical annual earnings at 10 years explanation">
                  <p className="mb-1">
                    This is the typical annual earnings of former students about
                    10 years after they first enrolled, based on federal tax
                    data.
                  </p>
                  <p>
                    Conceptually it&apos;s the{' '}
                    <span className="font-semibold">
                      median annual earnings 10 years after entry
                    </span>
                    .
                  </p>
                </InfoTooltip>
              </dt>
              <dd className="font-medium">
                {earningsAt10Yrs ? `$${earningsAt10Yrs.toLocaleString()}` : '—'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card space-y-2">
          <h2 className="text-sm font-semibold text-slate-100">
            ROI & break-even (estimates)
          </h2>
          <p className="text-xs text-slate-300">
            These are rough estimates derived from net price, median debt, and
            10-year earnings using standard assumptions (4-year completion, 5%
            simple interest on debt, and steady earnings). They are not
            guarantees.
          </p>
          <dl className="mt-2 space-y-1 text-xs text-slate-300">
            <div className="flex justify-between gap-4">
              <dt className="flex items-center text-slate-500">
                Break-even (years)
                <InfoTooltip label="Break-even years explanation">
                  <p className="mb-1">
                    Break-even is about how many years of extra earnings it
                    takes to cover the total cost of attending, including
                    interest on typical student debt.
                  </p>
                  <p className="mb-1">
                    Conceptually, it compares the{' '}
                    <span className="font-semibold">
                      total cost with interest
                    </span>{' '}
                    to an estimate of your{' '}
                    <span className="font-semibold">
                      annual earnings premium
                    </span>
                    .
                  </p>
                  <p>
                    It uses simplifying assumptions (4-year completion, 5%
                    simple interest, and typical earnings) and is meant as a
                    guide, not a promise.
                  </p>
                </InfoTooltip>
              </dt>
              <dd className="font-medium">
                {breakEvenYears != null ? `${breakEvenYears} yrs` : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="flex items-center text-slate-500">
                Earnings premium vs cost
                <InfoTooltip label="Earnings premium versus cost explanation">
                  <p className="mb-1">
                    Earnings premium vs cost is a rough estimate of how much
                    more money a typical student earns over about 10 years
                    compared with what they paid to attend, including interest
                    on typical student debt.
                  </p>
                  <p className="mb-1">
                    Conceptually it looks like:{' '}
                    <span className="font-semibold">
                      10-year earnings − 4 years of net price − 10-year debt
                      with interest
                    </span>
                    .
                  </p>
                  <p>
                    It uses simplifying assumptions (steady earnings, 4-year
                    completion, 5% simple interest) and should be read as an
                    estimate, not a guarantee.
                  </p>
                </InfoTooltip>
              </dt>
              <dd className="font-medium">
                {earningsPremium10Yrs != null
                  ? `$${earningsPremium10Yrs.toLocaleString()}`
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="flex items-center text-slate-500">
                Debt over 10 yrs (est.)
                <InfoTooltip label="Debt over 10 years explanation">
                  <p className="mb-1">
                    Debt over 10 years estimates how much the typical student
                    debt turns into over a decade of repayment under a simple
                    interest assumption.
                  </p>
                  <p className="mb-1">
                    With 5% simple interest over 10 years, a rough formula is:{' '}
                    <span className="font-semibold">
                      median debt × (1 + 0.05 × 10)
                    </span>
                    .
                  </p>
                  <p>
                    Actual repayment paths, interest rates, and timelines vary a
                    lot, so treat this as a rule-of-thumb estimate.
                  </p>
                </InfoTooltip>
              </dt>
              <dd className="font-medium">
                {debtWithInterest10Yrs != null
                  ? `$${debtWithInterest10Yrs.toLocaleString()}`
                  : '—'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card space-y-2">
          <h2 className="text-sm font-semibold text-slate-100">How to read</h2>
          <ul className="list-disc space-y-1 pl-5 text-xs text-slate-300">
            <li>
              <span className="font-medium">Net price</span> is the typical
              amount students pay for one year after grants and scholarships,
              not the full sticker price.
            </li>
            <li>
              <span className="font-medium">Median debt</span> is total student
              borrowing at or near graduation for a typical graduate; your own
              borrowing could be higher or lower.
            </li>
            <li>
              <span className="font-medium">Earnings</span> come from federal
              tax data and reflect typical former students; they do not capture
              non-monetary value or big career changes.
            </li>
            <li>
              <span className="font-medium">ROI metrics</span> (debt over 10
              years, earnings premium vs cost, and break-even years) are
              approximate and rely on standard assumptions, so treat them as
              directional guides rather than precise forecasts.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

