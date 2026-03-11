'use client';

import { useState, useEffect } from 'react';
import { getDb } from '@/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';

type AuthUser = { id: string; email?: string | null };

function ShortlistContent({ user }: { user: AuthUser }) {
  const db = getDb();
  const { data, isLoading, error } = db.useQuery({
    saved_schools: {
      $: {
        where: { userId: user.id },
      },
    },
    comparisons: {
      $: {
        where: { userId: user.id },
      },
    },
  });

  const [schoolNames, setSchoolNames] = useState<Record<string, string>>({});
  const [editingSavedSchoolId, setEditingSavedSchoolId] = useState<string | null>(null);
  const [editingSavedSchoolNotes, setEditingSavedSchoolNotes] = useState('');
  const [editingCompId, setEditingCompId] = useState<string | null>(null);
  const [editingCompName, setEditingCompName] = useState('');
  const [editingCompNotes, setEditingCompNotes] = useState('');

  useEffect(() => {
    const list = (data?.saved_schools ?? []) as unknown as { schoolId: string }[];
    const ids = [...new Set(list.map((s) => String(s.schoolId)).filter(Boolean))];
    if (ids.length === 0) {
      setSchoolNames({});
      return;
    }
    let cancelled = false;
    const map: Record<string, string> = {};
    Promise.all(
      ids.map((schoolId: string) =>
        fetch(`/api/schools?id=${encodeURIComponent(schoolId)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((school: { name?: string } | null) => {
            if (!cancelled && school?.name) map[schoolId] = school.name;
          })
      )
    ).then(() => {
      if (!cancelled) setSchoolNames((prev) => ({ ...prev, ...map }));
    });
    return () => {
      cancelled = true;
    };
  }, [data?.saved_schools]);

  const startEditSavedSchool = (item: { id: string; notes?: string }) => {
    setEditingSavedSchoolId(item.id);
    setEditingSavedSchoolNotes(item.notes ?? '');
  };
  const saveSavedSchoolNotes = () => {
    if (!editingSavedSchoolId) return;
    db.transact(
      db.tx.saved_schools[editingSavedSchoolId].update({
        notes: editingSavedSchoolNotes.trim() || undefined,
      })
    );
    setEditingSavedSchoolId(null);
  };

  const startEditComp = (comp: { id: string; name: string; notes?: string }) => {
    setEditingCompId(comp.id);
    setEditingCompName(comp.name);
    setEditingCompNotes(comp.notes ?? '');
  };
  const saveCompEdits = () => {
    if (!editingCompId) return;
    db.transact(
      db.tx.comparisons[editingCompId].update({
        name: editingCompName.trim(),
        notes: editingCompNotes.trim() || undefined,
      })
    );
    setEditingCompId(null);
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-chalk">Your saved work</h1>
        <p className="mt-2 max-w-2xl text-sm text-neon/70">
          Saved schools and comparisons tied to your email. Use this as a
          working list to reflect, share, and revisit.
        </p>
      </section>

      {isLoading && (
        <p className="text-sm text-neon/60">Loading your saved work…</p>
      )}
      {error && (
        <p className="text-sm text-red-400">
          Something went wrong loading your data.
        </p>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-chalk">
            Saved schools
          </h2>
          <ul className="space-y-2 text-xs text-chalk/80">
            {data?.saved_schools?.map((item: any) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border border-neon-dim/15 bg-night/60 px-3 py-2.5 transition-colors duration-150 hover:border-neon-dim/25"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/schools/${item.schoolId}`}
                      className="font-medium text-chalk transition-colors duration-150 hover:text-neon"
                    >
                      {schoolNames[item.schoolId] ?? `School ${item.schoolId}`}
                    </Link>
                    <p className="text-[11px] text-neon/50 mt-0.5">
                      {item.schoolId ? (
                        <Link href={`/schools/${item.schoolId}`} className="transition-colors duration-150 hover:text-neon/80">
                          View details
                        </Link>
                      ) : (
                        '—'
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => db.transact(db.tx.saved_schools[item.id].delete())}
                      className="text-[11px] text-neon/40 transition-colors duration-150 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {editingSavedSchoolId === item.id ? (
                  <div className="mt-1 space-y-1">
                    <textarea
                      value={editingSavedSchoolNotes}
                      onChange={(e) => setEditingSavedSchoolNotes(e.target.value)}
                      placeholder="Personal notes (e.g. beautiful campus, great debate club)"
                      rows={2}
                      className="input w-full resize-y text-xs"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveSavedSchoolNotes}
                        className="btn text-[11px]"
                      >
                        Save notes
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSavedSchoolId(null)}
                        className="text-[11px] text-neon/60 transition-colors duration-150 hover:text-chalk"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {item.notes && (
                      <p className="text-[11px] text-neon/60 whitespace-pre-wrap">
                        {item.notes}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => startEditSavedSchool(item)}
                      className="text-[11px] text-neon/40 transition-colors duration-150 hover:text-neon/80 text-left"
                    >
                      {item.notes ? 'Edit notes' : 'Add notes'}
                    </button>
                  </>
                )}
              </li>
            ))}
            {(!data || data.saved_schools?.length === 0) && (
              <li className="text-xs text-neon/50">
                You haven&apos;t saved any schools yet. Use &quot;Save to
                saved work&quot; on a school card to add one.
              </li>
            )}
          </ul>
        </div>

        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-chalk">
            Saved comparisons
          </h2>
          <ul className="space-y-2 text-xs text-chalk/80">
            {data?.comparisons?.map((comp: any) => (
              <li
                key={comp.id}
                className="flex flex-col gap-2 rounded-lg border border-neon-dim/15 bg-night/60 px-3 py-2.5 transition-colors duration-150 hover:border-neon-dim/25"
              >
                {editingCompId === comp.id ? (
                  <div className="space-y-2">
                    <label className="block">
                      <span className="text-neon/60">Name</span>
                      <input
                        type="text"
                        value={editingCompName}
                        onChange={(e) => setEditingCompName(e.target.value)}
                        className="input mt-0.5 w-full text-xs"
                      />
                    </label>
                    <label className="block">
                      <span className="text-neon/60">Notes</span>
                      <textarea
                        value={editingCompNotes}
                        onChange={(e) => setEditingCompNotes(e.target.value)}
                        placeholder="e.g. granted 15k scholarship for one of these"
                        rows={2}
                        className="input mt-0.5 w-full resize-y text-xs"
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveCompEdits}
                        className="btn text-[11px]"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCompId(null)}
                        className="text-[11px] text-neon/60 transition-colors duration-150 hover:text-chalk"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/compare?id=${comp.id}`}
                          className="font-medium text-chalk transition-colors duration-150 hover:text-neon"
                        >
                          {comp.name}
                        </Link>
                        <p className="text-[11px] text-neon/50 mt-0.5">
                          <Link
                            href={`/compare?id=${comp.id}`}
                            className="transition-colors duration-150 hover:text-neon/80"
                          >
                            View comparison
                          </Link>
                        </p>
                        {comp.notes && (
                          <p className="text-[11px] text-neon/60 whitespace-pre-wrap mt-0.5">
                            {comp.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          className="text-[11px] text-neon/50 transition-colors duration-150 hover:text-neon"
                          onClick={(e) => {
                            e.preventDefault();
                            navigator.clipboard.writeText(
                              `${window.location.origin}/compare?id=${comp.id}`,
                            );
                          }}
                        >
                          Copy link
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditComp(comp)}
                          className="text-[11px] text-neon/40 transition-colors duration-150 hover:text-chalk/80"
                        >
                          {comp.notes ? 'Edit' : 'Add notes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => db.transact(db.tx.comparisons[comp.id].delete())}
                          className="text-[11px] text-neon/40 transition-colors duration-150 hover:text-red-400"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            ))}
            {(!data || data.comparisons?.length === 0) && (
              <li className="text-xs text-neon/50">
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

export default function ShortlistPage() {
  const db = getDb();
  const { user, isLoading: authLoading } = db.useAuth();

  if (authLoading) {
    return <p className="text-sm text-neon/60">Checking login…</p>;
  }

  if (!user) {
    redirect('/login');
  }

  return <ShortlistContent user={user} />;
}
