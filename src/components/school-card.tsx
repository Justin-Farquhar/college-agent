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

type RoiTier = 'standout' | 'strong' | 'positive' | 'unclear' | 'limited';

function getRoiTier(school: School): RoiTier {
  if (school.roiSimple != null && Number.isFinite(school.roiSimple)) {
    if (school.roiSimple > 200_000) return 'standout';
    if (school.roiSimple > 100_000) return 'strong';
    if (school.roiSimple > 0) return 'positive';
    return 'unclear';
  }
  const earningsVsPrice = school.earningsAt10Yrs - school.netPrice;
  if (!Number.isFinite(earningsVsPrice)) return 'limited';
  if (earningsVsPrice > 200_000) return 'standout';
  if (earningsVsPrice > 100_000) return 'strong';
  if (earningsVsPrice > 0) return 'positive';
  return 'unclear';
}

const roiBadgeConfig: Record<RoiTier, { label: string; className: string }> = {
  standout: { label: 'ROI: standout', className: 'bg-neon/20 text-neon border border-neon/30' },
  strong:   { label: 'ROI: strong',   className: 'bg-neon-dim/20 text-neon border border-neon-dim/30' },
  positive: { label: 'ROI: positive', className: 'bg-neon-dim/10 text-neon/80 border border-neon-dim/20' },
  unclear:  { label: 'ROI: unclear',  className: 'bg-chalk/10 text-chalk/60 border border-chalk/15' },
  limited:  { label: 'ROI: limited data', className: 'bg-chalk/10 text-chalk/50 border border-chalk/10' },
};

export function SchoolCard({
  school,
  canSave,
  savedSchoolId,
  onSave,
  onRemove,
  onAddedToCompare,
}: {
  school: School;
  canSave: boolean;
  savedSchoolId?: string | null;
  onSave?: () => void;
  onRemove?: () => void;
  onAddedToCompare?: (schoolName: string) => void;
}) {
  const handleCompareClick = () => {
    addToCompareSelection(school.id);
    onAddedToCompare?.(school.name);
  };

  const tier = getRoiTier(school);
  const badge = roiBadgeConfig[tier];

  return (
    <article className="card flex flex-col justify-between gap-3 transition-all duration-200 hover:border-neon-dim/40 hover:shadow-lg hover:shadow-black/50">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/schools/${school.id}`}
              className="text-sm font-semibold text-chalk transition-colors duration-150 hover:text-neon"
            >
              {school.name}
            </Link>
            <p className="text-xs text-neon/60">
              {school.state} · {school.isPublic ? 'Public' : 'Private'}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
          <div>
            <dt className="text-neon/50">Avg. net price</dt>
            <dd className="mt-0.5 font-semibold text-chalk/90">
              {school.netPrice ? `$${school.netPrice.toLocaleString()}` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-neon/50">Median debt</dt>
            <dd className="mt-0.5 font-semibold text-chalk/90">
              {school.medianDebt ? `$${school.medianDebt.toLocaleString()}` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-neon/50">Completion</dt>
            <dd className="mt-0.5 font-semibold text-chalk/90">
              {school.completionRate ? `${school.completionRate.toFixed(1)}%` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-neon/50">Earnings @10 yrs</dt>
            <dd className="mt-0.5 font-semibold text-chalk/90">
              {school.earningsAt10Yrs ? `$${school.earningsAt10Yrs.toLocaleString()}` : '—'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-neon-dim/10 pt-2.5">
        <button
          type="button"
          onClick={handleCompareClick}
          className="btn py-1 text-xs"
        >
          Compare
        </button>
        <Link
          href={`/schools/${school.id}`}
          className="text-xs text-chalk/60 transition-colors duration-150 hover:text-chalk"
        >
          View details
        </Link>
        {canSave && savedSchoolId && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-neon/50 transition-colors duration-150 hover:text-red-400"
          >
            Remove from saved
          </button>
        )}
        {canSave && !savedSchoolId && onSave && (
          <button
            type="button"
            onClick={onSave}
            className="text-xs text-chalk/60 transition-colors duration-150 hover:text-chalk"
          >
            Save
          </button>
        )}
      </div>
    </article>
  );
}
