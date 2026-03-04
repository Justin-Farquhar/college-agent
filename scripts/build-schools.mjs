/**
 * Build script: CSV (or colleges.json) → normalized schools + derived stats → data/schools.json
 * Run once after placing scorecard.csv in data/. The website then reads schools.json via API.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse';

const DATA_DIR = path.join(process.cwd(), 'data');
const CSV_PATH = path.join(DATA_DIR, 'scorecard.csv');
const COLLEGES_PATH = path.join(DATA_DIR, 'colleges.json');
const OUTPUT_PATH = path.join(DATA_DIR, 'schools.json');

const ASSUMED_YEARS_TO_GRADUATE = 4;
const ASSUMED_DEBT_INTEREST_RATE = 0.05;
const YEARS_FOR_EARNINGS = 10;

function fromCsvRow(r) {
  return {
    name: r.INSTNM ?? r.INSTITUTION_NAME ?? null,
    state: r.STABBR ?? r.STATE ?? null,
    isPublic:
      r.OWNERSHIP === 'Public' ||
      r.SECTOR === 'Public' ||
      r.CONTROL === '1' ||
      r.CONTROL === 1 ||
      r.OWNERSHIP === 1,
    netPrice:
      Number(r.AVG_NET_PRICE) || Number(r.NPT4_PUB) || Number(r.NPT4_PRIV) || null,
    medianDebt: Number(r.DEBT_MDN) || null,
    completionRate:
      typeof r.C150_4 === 'number' ? r.C150_4 * 100 : r.C150_4 ? Number(r.C150_4) * 100 : null,
    earlyCareerEarnings: Number(r.MD_EARN_WNE_P10) || null,
    earningsAt10Yrs: Number(r.MD_EARN_WNE_P10) || null,
    institutionId:
      r.UNITID != null ? String(r.UNITID) : r.INSTID != null ? String(r.INSTID) : r.INSTITUTION_ID != null ? String(r.INSTITUTION_ID) : null,
  };
}

function addDerived(school) {
  const netPrice = school.netPrice ?? 0;
  const medianDebt = school.medianDebt ?? 0;
  const earningsAt10Yrs = school.earningsAt10Yrs ?? 0;

  const debtWithInterest = medianDebt * (1 + ASSUMED_DEBT_INTEREST_RATE * YEARS_FOR_EARNINGS);
  const earningsPremium10Yrs = earningsAt10Yrs * ASSUMED_YEARS_TO_GRADUATE - netPrice;
  const roiSimple = Number.isFinite(earningsPremium10Yrs) ? earningsPremium10Yrs : null;
  const breakEvenYears =
    earningsAt10Yrs > 0 && netPrice > 0
      ? (netPrice / (earningsAt10Yrs / YEARS_FOR_EARNINGS))
      : null;

  return {
    ...school,
    debtWithInterest10Yrs: Math.round(debtWithInterest),
    earningsPremium10Yrs: roiSimple != null ? Math.round(roiSimple) : null,
    roiSimple,
    breakEvenYears: breakEvenYears != null ? Math.round(breakEvenYears * 10) / 10 : null,
  };
}

async function loadFromCsv() {
  const records = [];
  await new Promise((resolve, reject) => {
    const parser = parse({ columns: true, skip_empty_lines: true });
    parser.on('readable', () => {
      let record;
      while ((record = parser.read())) records.push(record);
    });
    parser.on('error', reject);
    parser.on('end', resolve);
    fs.createReadStream(CSV_PATH).pipe(parser);
  });
  return records.map(fromCsvRow);
}

async function main() {
  let rows = [];

  if (fs.existsSync(CSV_PATH)) {
    console.log('Reading from CSV:', CSV_PATH);
    rows = await loadFromCsv();
  } else if (fs.existsSync(COLLEGES_PATH)) {
    console.log('Reading from', COLLEGES_PATH);
    const raw = fs.readFileSync(COLLEGES_PATH, 'utf8');
    rows = JSON.parse(raw);
  } else {
    console.error(
      `No input found. Put scorecard.csv (or colleges.json) in the data/ folder, then run:\n  npm run data:build`
    );
    process.exit(1);
  }

  const schools = rows.map((r, i) => {
    const id = r.institutionId || `school-${i + 1}`;
    const normalized = {
      id,
      name: r.name ?? '',
      state: r.state ?? '',
      isPublic: !!r.isPublic,
      netPrice: r.netPrice ?? 0,
      medianDebt: r.medianDebt ?? 0,
      completionRate: r.completionRate ?? 0,
      earlyCareerEarnings: r.earlyCareerEarnings ?? 0,
      earningsAt10Yrs: r.earningsAt10Yrs ?? 0,
      institutionId: r.institutionId ?? null,
    };
    return addDerived(normalized);
  });

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(schools), 'utf8');
  console.log(`Wrote ${schools.length} schools to ${OUTPUT_PATH}. You can start the app and search.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
