'use client';

import { useState, useCallback, useMemo, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { id } from '@instantdb/react';
import { SchoolSearchFilters } from '@/components/school-search-filters';
import { SchoolCard } from '@/components/school-card';
import { getDb } from '@/lib/db';

function HomeContent() {
  const db = getDb();
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const savedSchoolIdBySchoolId = useMemo(() => {
    const map = new Map<string, string>();
    const list = (savedData?.saved_schools ?? []) as unknown as { id: string; schoolId: string }[];
    list.forEach((s) => {
      map.set(String(s.schoolId), s.id);
    });
    return map;
  }, [savedData?.saved_schools]);

  // Initialise from URL so state survives back-navigation
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') ?? '');
  const [stateFilter, setStateFilter] = useState(() => searchParams.get('state') ?? '');
  const [isPublicFilter, setIsPublicFilter] = useState(() => searchParams.get('type') ?? '');
  const [schools, setSchools] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [compareToast, setCompareToast] = useState<{
    visible: boolean;
    schoolName?: string;
  }>({ visible: false });

  const hasSearchCriteria = Boolean(
    searchTerm.trim() || stateFilter || isPublicFilter,
  );

  const handleSaveSchool = useCallback(
    (schoolId: string) => {
      if (!user) return;
      setSaveError(null);
      try {
        db.transact(
          db.tx.saved_schools[id()].update({
            userId: user.id,
            schoolId,
          })
        );
      } catch (err) {
        setSaveError("Couldn't save. Try again.");
      }
    },
    [db, user]
  );

  const handleRemoveSchool = useCallback(
    (savedSchoolId: string) => {
      setSaveError(null);
      try {
        db.transact(db.tx.saved_schools[savedSchoolId].delete());
      } catch (err) {
        setSaveError("Couldn't remove. Try again.");
      }
    },
    [db]
  );

  const runSearch = useCallback(async () => {
    // Keep the URL in sync so back-navigation restores the search
    const urlParams = new URLSearchParams();
    if (searchTerm.trim()) urlParams.set('q', searchTerm.trim());
    if (stateFilter) urlParams.set('state', stateFilter);
    if (isPublicFilter) urlParams.set('type', isPublicFilter);
    router.replace(urlParams.toString() ? `/?${urlParams}` : '/', { scroll: false });

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
  }, [searchTerm, stateFilter, isPublicFilter, hasSearchCriteria, router]);

  // Auto-run search on mount if URL already has params (e.g. user pressed Back)
  const didMountSearch = useRef(false);
  useEffect(() => {
    if (didMountSearch.current) return;
    didMountSearch.current = true;
    if (hasSearchCriteria) {
      runSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleAddedToCompare = useCallback((schoolName: string) => {
    setCompareToast({ visible: true, schoolName });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setCompareToast((prev) => ({ ...prev, visible: false }));
    }, 4000);
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-chalk sm:text-3xl">
          Find the right college using real outcomes
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neon/70">
          Search the College Scorecard dataset. Results include net price, debt,
          completion, earnings, and derived stats (ROI, break-even). Filter by
          state and type, then compare or save to your list.
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
      {saveError && <p className="text-sm text-red-400">{saveError}</p>}

      {!hasSearchCriteria && (
        <div className="card rounded-xl border-neon-dim/15 bg-night-card/40 text-center">
          <p className="text-sm text-neon/60">
            Enter a school name and/or choose state / type above, then search to
            see results.
          </p>
        </div>
      )}

      {hasSearchCriteria && (
        <>
          {isLoading && (
            <p className="text-sm text-neon/60">Loading schools…</p>
          )}
          {!isLoading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {schools.map((school) => {
                const schoolId = String(school.id);
                const savedSchoolId = savedSchoolIdBySchoolId.get(schoolId) ?? null;
                return (
                  <SchoolCard
                    key={schoolId}
                    school={
                      school as Parameters<typeof SchoolCard>[0]['school']
                    }
                    canSave={!!user}
                    savedSchoolId={savedSchoolId}
                    onSave={
                      user ? () => handleSaveSchool(schoolId) : undefined
                    }
                    onRemove={
                      savedSchoolId
                        ? () => handleRemoveSchool(savedSchoolId)
                        : undefined
                    }
                    onAddedToCompare={handleAddedToCompare}
                  />
                );
              })}
            </div>
          )}
          {!isLoading && schools.length === 0 && hasSearchCriteria && (
            <p className="text-sm text-neon/60">
              No schools match. Try a different name or filters.
            </p>
          )}
        </>
      )}

      <p className="text-xs text-neon/40">
        Data is from your built dataset (run{' '}
        <code className="rounded bg-neon-dim/15 px-1 text-chalk/70">npm run data:build</code>{' '}
        with scorecard.csv in{' '}
        <code className="rounded bg-neon-dim/15 px-1 text-chalk/70">data/</code>).
      </p>

      {compareToast.visible && (
        <div className="fixed bottom-4 left-1/2 z-30 w-full max-w-md -translate-x-1/2 rounded-xl border border-neon-dim/30 bg-night-card/95 px-4 py-3 text-xs text-chalk shadow-2xl shadow-black/60 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-chalk">
                Added to Compare
                {compareToast.schoolName ? `: ${compareToast.schoolName}` : ''}
              </p>
              <p className="mt-0.5 text-[11px] text-neon/60">
                Open the Compare tab at the top to see selected schools side by
                side.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/compare"
                className="rounded-md bg-neon-dim px-2.5 py-1 text-[11px] font-semibold text-night transition-colors duration-150 hover:bg-neon hover:text-night"
              >
                View Compare
              </Link>
              <button
                type="button"
                className="text-[11px] text-neon/50 transition-colors duration-150 hover:text-chalk"
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

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
