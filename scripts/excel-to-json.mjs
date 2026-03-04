import fs from 'node:fs';
import path from 'node:path';
import xlsx from 'xlsx';
import { parse } from 'csv-parse';

const DATA_DIR = path.join('data');
const XLSX_PATH = path.join(DATA_DIR, 'scorecard.xlsx');
const CSV_PATH = path.join(DATA_DIR, 'scorecard.csv');
const OUTPUT_PATH = path.join('data', 'colleges.json');

function mapRow(row) {
  const r = row;
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
      Number(r.AVG_NET_PRICE) ||
      Number(r.NPT4_PUB) ||
      Number(r.NPT4_PRIV) ||
      null,
    medianDebt: Number(r.DEBT_MDN) || null,
    completionRate:
      typeof r.C150_4 === 'number'
        ? r.C150_4 * 100
        : r.C150_4
        ? Number(r.C150_4) * 100
        : null,
    earlyCareerEarnings: Number(r.MD_EARN_WNE_P10) || null,
    earningsAt10Yrs: Number(r.MD_EARN_WNE_P10) || null,
    institutionId:
      r.UNITID != null
        ? String(r.UNITID)
        : r.INSTID != null
        ? String(r.INSTID)
        : r.INSTITUTION_ID != null
        ? String(r.INSTITUTION_ID)
        : null,
  };
}

function findInputPath() {
  let inputPath = null;

  if (fs.existsSync(XLSX_PATH)) {
    inputPath = XLSX_PATH;
  } else if (fs.existsSync(CSV_PATH)) {
    inputPath = CSV_PATH;
  } else if (fs.existsSync(DATA_DIR)) {
    const candidates = fs
      .readdirSync(DATA_DIR)
      .filter((f) => f.toLowerCase().endsWith('.xlsx') || f.toLowerCase().endsWith('.csv'));
    if (candidates.length > 0) {
      inputPath = path.join(DATA_DIR, candidates[0]);
    }
  }

  return inputPath;
}

async function main() {
  const inputPath = findInputPath();

  if (!inputPath) {
    console.error(
      `Could not find a College Scorecard file.\n` +
        `Place a single .xlsx or .csv file in the "data" folder (for example: ${XLSX_PATH} or ${CSV_PATH}) and run again.`,
    );
    process.exit(1);
  }

  console.log(`Reading College Scorecard data from: ${inputPath}`);

  const ext = path.extname(inputPath).toLowerCase();
  let mapped = [];

  if (ext === '.csv') {
    // Stream and parse CSV – more memory-efficient for large files
    const records = [];
    await new Promise((resolve, reject) => {
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
      });

      parser.on('readable', () => {
        let record;
        // eslint-disable-next-line no-cond-assign
        while ((record = parser.read())) {
          records.push(record);
        }
      });

      parser.on('error', (err) => reject(err));
      parser.on('end', () => resolve());

      fs.createReadStream(inputPath).pipe(parser);
    });

    console.log(`Parsed ${records.length} rows from CSV.`);
    mapped = records.map(mapRow);
  } else {
    // Fallback for .xlsx if you ever use it
    const workbook = xlsx.readFile(inputPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });
    console.log(`Parsed ${rows.length} rows from spreadsheet.`);
    mapped = rows.map(mapRow);
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mapped, null, 2), 'utf8');

  console.log(
    `Wrote ${mapped.length} institution records to ${OUTPUT_PATH}. You can now run "npm run data:seed".`,
  );
}

main().catch((err) => {
  console.error('Error while converting College Scorecard data:', err);
  process.exit(1);
});

