import fs from 'node:fs';
import path from 'node:path';
import { init, id as instantId } from '@instantdb/react';

const APP_ID = '29031c31-34e3-4764-8e6e-1e2dec7aa2c2';

// For this backend seed script we don't need the TypeScript schema;
// we can initialize InstantDB with just the appId.
const db = init({
  appId: APP_ID,
});

const INPUT_PATH = path.join('data', 'colleges.json');

async function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(
      `Expected JSON data at ${INPUT_PATH}. Run scripts/excel-to-json.mjs first.`,
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT_PATH, 'utf8');
  const records = JSON.parse(raw);

  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    const tx = batch.map((r) =>
      db.tx.schools[instantId()].update({
        name: r.name,
        state: r.state,
        isPublic: !!r.isPublic,
        netPrice: r.netPrice ?? null,
        medianDebt: r.medianDebt ?? null,
        completionRate: r.completionRate ?? null,
        earlyCareerEarnings: r.earlyCareerEarnings ?? null,
        earningsAt10Yrs: r.earningsAt10Yrs ?? null,
        institutionId: r.institutionId ?? null,
      }),
    );

    // eslint-disable-next-line no-await-in-loop
    await db.transact(tx);
    console.log(`Seeded ${Math.min(i + BATCH_SIZE, records.length)} records…`);
  }

  console.log('Seeding complete.');
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

