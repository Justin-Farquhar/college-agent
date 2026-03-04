'use client';

import Link from 'next/link';
import { addToCompareSelection } from '@/lib/compareSelection';

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
  roiSimple?: number | null;
};

function getRoiBadge(school: School): string {
  if (school.roiSimple != null && Number.isFinite(school.roiSimple)) {
    if (school.roiSimple > 200_000) return 'ROI: standout';
    if (school.roiSimple > 100_000) return 'ROI: strong';
    if (school.roiSimple > 0) return 'ROI: positive';
    return 'ROI: unclear';
  }
  const earningsVsPrice = school.earningsAt10Yrs - school.netPrice;
  if (!Number.isFinite(earningsVsPrice)) return 'ROI: data limited';
  if (earningsVsPrice > 200_000) return 'ROI: standout';
  if (earningsVsPrice > 100_000) return 'ROI: strong';
  if (earningsVsPrice > 0) return 'ROI: positive';
  return 'ROI: unclear';
}

export function SchoolCard({
  school,
  canSave,
  onAddedToCompare,
}: {
  school: School;
  canSave: boolean;
  onAddedToCompare?: (schoolName: string) => void;
}) {
  const handleCompareClick = () => {
    addToCompareSelection(school.id);
    onAddedToCompare?.(school.name);
  };

  return (
    <article className="card flex flex-col justify-between gap-3">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/schools/${school.id}`}
              className="text-sm font-semibold text-slate-50 hover:text-blue-300"
            >
              {school.name}
            </Link>
            <p className="text-xs text-slate-400">
              {school.state} • {school.isPublic ? 'Public' : 'Private'}
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            {getRoiBadge(school)}
          </span>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
          <div>
            <dt className="text-slate-500">Avg. net price</dt>
            <dd className="font-medium">
              {school.netPrice ? `$${school.netPrice.toLocaleString()}` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Median debt</dt>
            <dd className="font-medium">
              {school.medianDebt
                ? `$${school.medianDebt.toLocaleString()}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Completion</dt>
            <dd className="font-medium">
              {school.completionRate
                ? `${school.completionRate.toFixed(1)}%`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Earnings @10 yrs</dt>
            <dd className="font-medium">
              {school.earningsAt10Yrs
                ? `$${school.earningsAt10Yrs.toLocaleString()}`
                : '—'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleCompareClick}
          className="btn text-xs"
        >
          Compare
        </button>
        <Link
          href={`/schools/${school.id}`}
          className="text-xs text-slate-300 hover:underline"
        >
          View details
        </Link>
      </div>
    </article>
  );
}

