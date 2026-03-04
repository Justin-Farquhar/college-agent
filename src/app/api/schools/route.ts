import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

const SCHOOLS_PATH = path.join(process.cwd(), 'data', 'schools.json');

let cached: Array<Record<string, unknown>> | null = null;

function getSchools(): Array<Record<string, unknown>> | null {
  if (cached) return cached;
  if (!fs.existsSync(SCHOOLS_PATH)) return null;
  const raw = fs.readFileSync(SCHOOLS_PATH, 'utf8');
  cached = JSON.parse(raw);
  return cached;
}

export async function GET(request: NextRequest) {
  try {
    const schools = getSchools();
    if (!schools) {
      return NextResponse.json(
        { error: 'School data not built. Run "npm run data:build" with scorecard.csv in data/.' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const q = (searchParams.get('q') ?? '').trim().toLowerCase();
    const state = (searchParams.get('state') ?? '').trim();
    const isPublic = searchParams.get('isPublic'); // 'true' | 'false' | ''

    if (id) {
      const one = schools.find((s) => String(s.id) === id || String(s.institutionId) === id);
      if (!one) return NextResponse.json({ error: 'School not found' }, { status: 404 });
      return NextResponse.json(one);
    }

    let result = schools;

    if (q) {
      result = result.filter((s) =>
        String(s.name ?? '').toLowerCase().includes(q)
      );
    }
    if (state) {
      result = result.filter((s) => String(s.state ?? '') === state);
    }
    if (isPublic === 'true') {
      result = result.filter((s) => s.isPublic === true);
    }
    if (isPublic === 'false') {
      result = result.filter((s) => s.isPublic === false);
    }

    const limit = Math.min(Number(searchParams.get('limit')) || 200, 500);
    result = result.slice(0, limit);

    return NextResponse.json(result);
  } catch (err) {
    console.error('Error in /api/schools:', err);
    return NextResponse.json(
      { error: 'Failed to load schools.' },
      { status: 500 }
    );
  }
}
