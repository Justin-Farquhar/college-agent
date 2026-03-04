const STORAGE_KEY = 'collegeAgent.compareSchools';

export type SchoolId = string;

export function getStoredCompareSelection(): SchoolId[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => String(v))
      .filter((v, idx, arr) => v && arr.indexOf(v) === idx);
  } catch {
    return [];
  }
}

export function setStoredCompareSelection(ids: SchoolId[]): void {
  if (typeof window === 'undefined') return;
  const unique = ids
    .map((v) => String(v))
    .filter((v, idx, arr) => v && arr.indexOf(v) === idx);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  } catch {
    // ignore storage failures
  }
}

export function addToCompareSelection(id: SchoolId): SchoolId[] {
  const current = getStoredCompareSelection();
  if (current.includes(String(id))) return current;
  const next = [...current, String(id)];
  setStoredCompareSelection(next);
  return next;
}

