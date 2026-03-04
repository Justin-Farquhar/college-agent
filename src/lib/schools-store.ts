import fs from 'node:fs';
import path from 'node:path';

const SCHOOLS_PATH = path.join(process.cwd(), 'data', 'schools.json');

let cached: Array<Record<string, unknown>> | null = null;

export function getAllSchools(): Array<Record<string, unknown>> {
  if (cached) return cached ?? [];
  if (!fs.existsSync(SCHOOLS_PATH)) return [];
  const raw = fs.readFileSync(SCHOOLS_PATH, 'utf8');
  cached = JSON.parse(raw);
  return cached ?? [];
}

export function getSchoolById(id: string): Record<string, unknown> | null {
  const schools = getAllSchools();
  const one =
    schools.find(
      (s) => String((s as any).id) === id || String((s as any).institutionId) === id,
    ) ?? null;
  return one;
}

