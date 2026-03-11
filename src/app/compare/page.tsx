'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { id as idGen } from '@instantdb/react';
import { InfoTooltip } from '@/components/InfoTooltip';
import {
  getStoredCompareSelection,
  setStoredCompareSelection,
} from '@/lib/compareSelection';
import { getDb } from '@/lib/db';

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
  breakEvenYears?: number | null;
};

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = getDb();
  const { user } = db.useAuth();
  const compId = searchParams.get('id');
  const { data: compData } = db.useQuery(
    compId
      ? {
          comparison_schools: {
            $: {
              where: { comparisonId: compId },
            },
          },
        }
      : null
  );
  const { data: currentCompData } = db.useQuery(
    compId && user
      ? {
          comparisons: {
            $: {
              where: { id: compId },
            },
          },
        }
      : null
  );
  const currentComparison = currentCompData?.comparisons?.[0];
  const canRemoveComparison = Boolean(user && compId && currentComparison && currentComparison.userId === user.id);

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveCompOpen, setSaveCompOpen] = useState(false);
  const [saveCompName, setSaveCompName] = useState('');
  const [saveCompNotes, setSaveCompNotes] = useState('');
  const [saveCompError, setSaveCompError] = useState<string | null>(null);
  const [saveCompSuccess, setSaveCompSuccess] = useState(false);

  useEffect(() => {
    if (!compId || !compData?.comparison_schools?.length) return;
    type CompSchool = { order?: number; schoolId: string };
    const items = compData.comparison_schools as unknown as CompSchool[];
    const ordered = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const schoolIds = ordered.map((r) => r.schoolId).filter(Boolean);
    if (schoolIds.length === 0) return;
    setStoredCompareSelection(schoolIds);
    router.replace(`/compare?schools=${encodeURIComponent(schoolIds.join(','))}&id=${compId}`);
  }, [compId, compData?.comparison_schools, router]);

  useEffect(() => {
    const schoolsParam = searchParams.get('schools');
    if (compId && !schoolsParam) return;
    const fromQuery = schoolsParam?.split(',').filter(Boolean) ?? [];
    const ids =
      fromQuery.length > 0 ? fromQuery : getStoredCompareSelection();
    if (ids.length === 0) {
      setSchools([]);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all(
      ids.map((sid) =>
        fetch(`/api/schools?id=${encodeURIComponent(sid)}`).then((r) => {
          if (!r.ok) throw new Error('Not found');
          return r.json();
        })
      )
    )
      .then((data) => {
        setSchools(data);
        setStoredCompareSelection(
          data.map((s: School) => String(s.id)),
        );
      })
      .catch(() => setError('Could not load one or more schools.'))
      .finally(() => setLoading(false));
  }, [searchParams, compId]);

  const handleRemoveComparisonFromSaved = useCallback(() => {
    if (!compId) return;
    db.transact(db.tx.comparisons[compId].delete());
    const schoolsParam = searchParams.get('schools');
    if (schoolsParam) {
      router.replace(`/compare?schools=${encodeURIComponent(schoolsParam)}`);
    } else {
      router.push('/compare');
    }
  }, [db, compId, searchParams, router]);

  const handleRemoveSchool = (schoolId: string) => {
    const current = getStoredCompareSelection();
    const next = current.filter((sId) => sId !== String(schoolId));
    setStoredCompareSelection(next);
    if (next.length === 0) {
      router.push('/');
      return;
    }
    const query = next.join(',');
    router.push(`/compare?schools=${encodeURIComponent(query)}`);
  };

  const handleSaveComparison = useCallback(() => {
    if (!user || schools.length < 2) return;
    const name = saveCompName.trim() || schools.map((s) => s.name).join(' vs ');
    setSaveCompError(null);
    try {
      const comparisonId = idGen();
      const txs = [
        db.tx.comparisons[comparisonId].update({
          name,
          notes: saveCompNotes.trim() || undefined,
          createdAt: new Date(),
          userId: user.id,
        }),
        ...schools.map((s, i) =>
          db.tx.comparison_schools[idGen()].update({
            comparisonId,
            schoolId: String(s.id),
            order: i,
          })
        ),
      ];
      db.transact(txs);
      setSaveCompSuccess(true);
      setSaveCompOpen(false);
      setSaveCompName('');
      setSaveCompNotes('');
      setTimeout(() => setSaveCompSuccess(false), 3000);
    } catch {
      setSaveCompError("Couldn't save. Try again.");
    }
  }, [db, user, schools, saveCompName, saveCompNotes]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-chalk">
            Compare colleges side by side
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neon/70">
            Select 2–4 schools from search results (click Compare on a card) and
            compare net price, debt, completion, earnings, and derived ROI.
          </p>
        </div>
      </section>

      {canRemoveComparison && (
        <section className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRemoveComparisonFromSaved}
            className="text-xs text-neon/50 transition-colors duration-150 hover:text-red-400"
          >
            Remove this comparison from saved work
          </button>
        </section>
      )}

      {user && !loading && schools.length >= 2 && (
        <section className="card space-y-3">
          {!saveCompOpen ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSaveCompOpen(true)}
                className="btn text-xs"
              >
                Save this comparison
              </button>
              {saveCompSuccess && (
                <span className="text-xs text-neon">
                  Saved. View in <Link href="/shortlist" className="underline">Saved work</Link>.
                </span>
              )}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveComparison();
              }}
              className="space-y-3"
            >
              <label className="block text-sm font-medium text-chalk">
                Name
                <input
                  type="text"
                  value={saveCompName}
                  onChange={(e) => setSaveCompName(e.target.value)}
                  placeholder={schools.map((s) => s.name).join(' vs ')}
                  className="input mt-1 w-full max-w-md"
                />
              </label>
              <label className="block text-sm font-medium text-chalk">
                Notes (optional)
                <textarea
                  value={saveCompNotes}
                  onChange={(e) => setSaveCompNotes(e.target.value)}
                  placeholder="e.g. granted 15k scholarship for one of these"
                  rows={2}
                  className="input mt-1 w-full max-w-md resize-y"
                />
              </label>
              {saveCompError && (
                <p className="text-xs text-red-400">{saveCompError}</p>
              )}
              <div className="flex gap-2">
                <button type="submit" className="btn text-xs">
                  Save to saved work
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSaveCompOpen(false);
                    setSaveCompError(null);
                  }}
                  className="text-xs text-neon/60 transition-colors duration-150 hover:text-chalk"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {getStoredCompareSelection().length === 0 && !compId && (
        <p className="text-sm text-neon/60">
          No schools in Compare yet. From search results, click
          &quot;Compare&quot; on a school card to add it here.
        </p>
      )}

      {loading && (
        <p className="text-sm text-neon/60">Loading schools…</p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && schools.length > 0 && (
        <section className="overflow-x-auto rounded-xl border border-neon-dim/20">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-night-card/90">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neon/60">
                  Metric
                </th>
                {schools.map((s) => (
                  <th
                    key={s.id}
                    className="px-4 py-3 text-left font-medium text-chalk"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <a
                          href={`/schools/${s.id}`}
                          className="transition-colors duration-150 hover:text-neon"
                        >
                          {s.name}
                        </a>
                        <div className="text-[10px] text-neon/50 mt-0.5">
                          {s.state} · {s.isPublic ? 'Public' : 'Private'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSchool(String(s.id))}
                        className="text-[10px] text-neon/40 transition-colors duration-150 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neon-dim/10 bg-night/40">
              <tr className="transition-colors duration-100 hover:bg-neon-dim/5">
                <td className="px-4 py-2.5 text-neon/60">
                  <div className="flex items-center">
                    Typical annual net price
                    <InfoTooltip label="Typical annual net price explanation">
                      <p className="mb-1">
                        Typical annual net price is what students usually pay
                        out of pocket for one year after grants and
                        scholarships.
                      </p>
                      <p>
                        Roughly:{' '}
                        <span className="font-semibold text-chalk">
                          sticker price per year – average grants and
                          scholarships per year
                        </span>
                        .
                      </p>
                    </InfoTooltip>
                  </div>
                </td>
                {schools.map((s) => (
                  <td key={s.id} className="px-4 py-2.5 font-semibold text-chalk/90">
                    {s.netPrice ? `$${s.netPrice.toLocaleString()}` : '—'}
                  </td>
                ))}
              </tr>
              <tr className="transition-colors duration-100 hover:bg-neon-dim/5">
                <td className="px-4 py-2.5 text-neon/60">
                  <div className="flex items-center">
                    Typical total student debt
                    <InfoTooltip label="Typical total student debt explanation">
                      <p className="mb-1">
                        Typical total student debt is the amount a typical
                        graduate owes in student loans at or near graduation.
                      </p>
                      <p>
                        Conceptually it&apos;s the{' '}
                        <span className="font-semibold text-chalk">
                          median total federal student loan balance at
                          graduation
                        </span>
                        .
                      </p>
                    </InfoTooltip>
                  </div>
                </td>
                {schools.map((s) => (
                  <td key={s.id} className="px-4 py-2.5 font-semibold text-chalk/90">
                    {s.medianDebt ? `$${s.medianDebt.toLocaleString()}` : '—'}
                  </td>
                ))}
              </tr>
              <tr className="transition-colors duration-100 hover:bg-neon-dim/5">
                <td className="px-4 py-2.5 text-neon/60">
                  <div className="flex items-center">
                    Debt over 10 yrs (est.)
                    <InfoTooltip label="Debt over 10 years explanation">
                      <p className="mb-1">
                        Debt over 10 years estimates how much the typical
                        student debt turns into over a decade of repayment under
                        a simple interest assumption.
                      </p>
                      <p className="mb-1">
                        With 5% simple interest over 10 years, a rough formula
                        is:{' '}
                        <span className="font-semibold text-chalk">
                          median debt × (1 + 0.05 × 10)
                        </span>
                        .
                      </p>
                      <p>
                        Actual repayment paths, interest rates, and timelines
                        vary a lot, so treat this as a rule-of-thumb estimate.
                      </p>
                    </InfoTooltip>
                  </div>
                </td>
                {schools.map((s) => (
                  <td key={s.id} className="px-4 py-2.5 font-semibold text-chalk/90">
                    {s.debtWithInterest10Yrs != null
                      ? `$${s.debtWithInterest10Yrs.toLocaleString()}`
                      : '—'}
                  </td>
                ))}
              </tr>
              <tr className="transition-colors duration-100 hover:bg-neon-dim/5">
                <td className="px-4 py-2.5 text-neon/60">
                  <div className="flex items-center">
                    Completion rate
                    <InfoTooltip label="Completion rate explanation">
                      <p className="mb-1">
                        Completion rate is the share of first-time, full-time
                        students who finish a degree here within a standard time
                        window.
                      </p>
                      <p>
                        Roughly:{' '}
                        <span className="font-semibold text-chalk">
                          completers ÷ cohort size × 100
                        </span>
                        .
                      </p>
                    </InfoTooltip>
                  </div>
                </td>
                {schools.map((s) => (
                  <td key={s.id} className="px-4 py-2.5 font-semibold text-chalk/90">
                    {s.completionRate != null
                      ? `${s.completionRate.toFixed(1)}%`
                      : '—'}
                  </td>
                ))}
              </tr>
              <tr className="transition-colors duration-100 hover:bg-neon-dim/5">
                <td className="px-4 py-2.5 text-neon/60">
                  <div className="flex items-center">
                    Typical annual earnings @10 yrs
                    <InfoTooltip label="Typical annual earnings at 10 years explanation">
                      <p className="mb-1">
                        This is the typical annual earnings of former students
                        about 10 years after they first enrolled, based on
                        federal tax data.
                      </p>
                      <p>
                        Conceptually it&apos;s the{' '}
                        <span className="font-semibold text-chalk">
                          median annual earnings 10 years after entry
                        </span>
                        .
                      </p>
                    </InfoTooltip>
                  </div>
                </td>
                {schools.map((s) => (
                  <td key={s.id} className="px-4 py-2.5 font-semibold text-chalk/90">
                    {s.earningsAt10Yrs
                      ? `$${s.earningsAt10Yrs.toLocaleString()}`
                      : '—'}
                  </td>
                ))}
              </tr>
              <tr className="transition-colors duration-100 hover:bg-neon-dim/5">
                <td className="px-4 py-2.5 text-neon/60">
                  <div className="flex items-center">
                    Earnings premium vs cost (10 yrs est.)
                    <InfoTooltip label="Earnings premium versus cost explanation">
                      <p className="mb-1">
                        Earnings premium vs cost is a rough estimate of how much
                        more money a typical student earns over about 10 years
                        compared with what they paid to attend, including
                        interest on typical student debt.
                      </p>
                      <p className="mb-1">
                        Conceptually it looks like:{' '}
                        <span className="font-semibold text-chalk">
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
                  </div>
                </td>
                {schools.map((s) => (
                  <td key={s.id} className="px-4 py-2.5 font-semibold text-chalk/90">
                    {s.earningsPremium10Yrs != null
                      ? `$${s.earningsPremium10Yrs.toLocaleString()}`
                      : '—'}
                  </td>
                ))}
              </tr>
              <tr className="transition-colors duration-100 hover:bg-neon-dim/5">
                <td className="px-4 py-2.5 text-neon/60">
                  <div className="flex items-center">
                    Break-even (years)
                    <InfoTooltip label="Break-even years explanation">
                      <p className="mb-1">
                        Break-even is about how many years of extra earnings it
                        takes to cover the total cost of attending, including
                        interest on typical student debt.
                      </p>
                      <p className="mb-1">
                        Conceptually, it compares the{' '}
                        <span className="font-semibold text-chalk">
                          total cost with interest
                        </span>{' '}
                        to an estimate of your{' '}
                        <span className="font-semibold text-chalk">
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
                  </div>
                </td>
                {schools.map((s) => (
                  <td key={s.id} className="px-4 py-2.5 font-semibold text-chalk/90">
                    {s.breakEvenYears != null
                      ? `${s.breakEvenYears} yrs`
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

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-neon/60">Loading comparison view…</p>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
