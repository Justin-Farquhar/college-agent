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
        <h1 className="text-2xl font-semibold tracking-tight">Your saved work</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Saved schools and comparisons tied to your email. Use this as a
          working list to reflect, share, and revisit.
        </p>
      </section>

      {isLoading && (
        <p className="text-sm text-slate-400">Loading your saved work…</p>
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
                className="flex flex-col gap-2 rounded-lg bg-slate-900/60 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/schools/${item.schoolId}`}
                      className="font-medium hover:text-brand-light"
                    >
                      {schoolNames[item.schoolId] ?? `School ${item.schoolId}`}
                    </Link>
                    <p className="text-[11px] text-slate-400">
                      {item.schoolId ? (
                        <Link href={`/schools/${item.schoolId}`} className="hover:underline">
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
                      className="text-[11px] text-slate-500 hover:text-red-300"
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
                        className="text-[11px] text-slate-400 hover:text-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {item.notes && (
                      <p className="text-[11px] text-slate-400 whitespace-pre-wrap">
                        {item.notes}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => startEditSavedSchool(item)}
                      className="text-[11px] text-slate-500 hover:text-slate-300"
                    >
                      {item.notes ? 'Edit notes' : 'Add notes'}
                    </button>
                  </>
                )}
              </li>
            ))}
            {(!data || data.saved_schools?.length === 0) && (
              <li className="text-xs text-slate-400">
                You haven&apos;t saved any schools yet. Use &quot;Save to
                saved work&quot; on a school card to add one.
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
                className="flex flex-col gap-2 rounded-lg bg-slate-900/60 px-3 py-2"
              >
                {editingCompId === comp.id ? (
                  <div className="space-y-2">
                    <label className="block">
                      <span className="text-slate-400">Name</span>
                      <input
                        type="text"
                        value={editingCompName}
                        onChange={(e) => setEditingCompName(e.target.value)}
                        className="input mt-0.5 w-full text-xs"
                      />
                    </label>
                    <label className="block">
                      <span className="text-slate-400">Notes</span>
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
                        className="text-[11px] text-slate-400 hover:text-slate-100"
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
                          className="font-medium hover:text-brand-light"
                        >
                          {comp.name}
                        </Link>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          <Link
                            href={`/compare?id=${comp.id}`}
                            className="hover:underline"
                          >
                            View comparison
                          </Link>
                        </p>
                        {comp.notes && (
                          <p className="text-[11px] text-slate-400 whitespace-pre-wrap mt-0.5">
                            {comp.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          className="text-[11px] text-slate-400 hover:text-brand-light"
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
                          className="text-[11px] text-slate-500 hover:text-slate-300"
                        >
                          {comp.notes ? 'Edit' : 'Add notes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => db.transact(db.tx.comparisons[comp.id].delete())}
                          className="text-[11px] text-slate-500 hover:text-red-300"
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

export default function ShortlistPage() {
  const db = getDb();
  const { user, isLoading: authLoading } = db.useAuth();

  if (authLoading) {
    return <p className="text-sm text-slate-400">Checking login…</p>;
  }

  if (!user) {
    redirect('/login');
  }

  return <ShortlistContent user={user} />;
}

