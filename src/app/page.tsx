'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { SchoolSearchFilters } from '@/components/school-search-filters';
import { SchoolCard } from '@/components/school-card';

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [isPublicFilter, setIsPublicFilter] = useState('');
  const [schools, setSchools] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareToast, setCompareToast] = useState<{
    visible: boolean;
    schoolName?: string;
  }>({ visible: false });

  const hasSearchCriteria = Boolean(
    searchTerm.trim() || stateFilter || isPublicFilter,
  );

  const runSearch = useCallback(async () => {
    if (!hasSearchCriteria) {
      setSchools([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('q', searchTerm.trim());
      if (stateFilter) params.set('state', stateFilter);
      if (isPublicFilter === 'public') params.set('isPublic', 'true');
      if (isPublicFilter === 'private') params.set('isPublic', 'false');
      params.set('limit', '200');
      const res = await fetch(`/api/schools?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || `HTTP ${res.status}`,
        );
      }
      const data = await res.json();
      setSchools(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setSchools([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, stateFilter, isPublicFilter, hasSearchCriteria]);

  const handleAddedToCompare = (schoolName: string) => {
    setCompareToast({ visible: true, schoolName });
    window.clearTimeout((handleAddedToCompare as any)._timer);
    (handleAddedToCompare as any)._timer = window.setTimeout(() => {
      setCompareToast((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Find the right college using real outcomes
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Search the College Scorecard dataset. Results include net price, debt,
          completion, earnings, and derived stats (ROI, break-even). Filter by
          state and type, then compare or shortlist.
        </p>
      </section>

      <SchoolSearchFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        stateFilter={stateFilter}
        onStateFilterChange={setStateFilter}
        isPublicFilter={isPublicFilter}
        onIsPublicFilterChange={setIsPublicFilter}
        onSearch={runSearch}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!hasSearchCriteria && (
        <div className="card rounded-xl border-slate-700 bg-slate-900/40 text-center">
          <p className="text-sm text-slate-300">
            Enter a school name and/or choose state / type above, then search to
            see results.
          </p>
        </div>
      )}

      {hasSearchCriteria && (
        <>
          {isLoading && (
            <p className="text-sm text-slate-400">Loading schools…</p>
          )}
          {!isLoading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {schools.map((school) => (
                <SchoolCard
                  key={String(school.id)}
                  school={
                    school as Parameters<typeof SchoolCard>[0]['school']
                  }
                  canSave={false}
                  onAddedToCompare={handleAddedToCompare}
                />
              ))}
            </div>
          )}
          {!isLoading && schools.length === 0 && hasSearchCriteria && (
            <p className="text-sm text-slate-400">
              No schools match. Try a different name or filters.
            </p>
          )}
        </>
      )}

      <p className="text-xs text-slate-400">
        Data is from your built dataset (run{' '}
        <code className="rounded bg-slate-800 px-1">npm run data:build</code>{' '}
        with scorecard.csv in{' '}
        <code className="rounded bg-slate-800 px-1">data/</code>).
      </p>

      {compareToast.visible && (
        <div className="fixed bottom-4 left-1/2 z-30 w-full max-w-md -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900/95 px-4 py-3 text-xs text-slate-100 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">
                Added to Compare tab
                {compareToast.schoolName ? `: ${compareToast.schoolName}` : ''}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Open the Compare tab at the top to see selected schools side by
                side.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/compare"
                className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-900 hover:bg-white"
              >
                View Compare
              </Link>
              <button
                type="button"
                className="text-[11px] text-slate-400 hover:text-slate-100"
                onClick={() =>
                  setCompareToast((prev) => ({ ...prev, visible: false }))
                }
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

