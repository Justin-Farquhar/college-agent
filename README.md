# College Agent

College Agent helps students and families compare colleges using real U.S. Department of Education College Scorecard data — net price, debt, completion rate, earnings, and derived ROI metrics. It works like a travel comparison site for colleges.

**Project status:** Feature-complete. Deployed on Vercel. No automated tests. Not under active development.

---

## How it works

1. A one-time build script (`npm run data:build`) reads `data/scorecard.csv`, normalizes fields, computes derived stats (ROI, break-even, debt-with-interest), and writes `data/schools.json`.
2. The website serves school data from that static JSON file via an in-memory API route — no database needed for search or compare.
3. Optional login (magic-link email via InstantDB) unlocks Saved work: per-user saved schools, saved comparisons, and personal notes.

**Data flow:** `scorecard.csv` → build script → `schools.json` → `/api/schools` → UI

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| School data | Static `data/schools.json` + in-memory API route |
| Auth & saved work | InstantDB (magic-link, no passwords) |
| Deployment | Vercel |

---

## Getting started

### 1. Install
```bash
npm install
```

### 2. Build school data
Place the College Scorecard CSV at `data/scorecard.csv`, then run:
```bash
npm run data:build
```
You should see: `Wrote N schools to data/schools.json`.

A pre-built `data/schools.json` is already committed to the repo, so this step is only needed if you want to refresh the dataset.

### 3. Run the app
```bash
npm run dev
```
Open `http://localhost:3000`.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (used by Vercel) |
| `npm run data:build` | Build `data/schools.json` from `data/scorecard.csv` |
| `npm run data:convert` | Convert an Excel/XLSX scorecard export to JSON (intermediate step) |

---

## Configuration

### InstantDB
The InstantDB App ID is hardcoded in `src/lib/db.ts` line 4:
```ts
const APP_ID = '29031c31-34e3-4764-8e6e-1e2dec7aa2c2';
```
This is a **public client-side identifier** (not a secret — analogous to a Firebase project ID). It is safe to commit. Access control is enforced server-side by InstantDB using the rules in `instant.perms.ts`.

- **Schema**: `instant.schema.ts` — defines `saved_schools`, `comparisons`, `comparison_schools` entities
- **Permissions**: `instant.perms.ts` — `saved_schools` and `comparisons` are user-owned (read/write/delete own only); school data is public read-only

### Environment variables
None required. The app runs with no `.env` file. The InstantDB App ID is the only external config and it is hardcoded intentionally.

---

## Codebase structure

```
src/
  app/
    page.tsx                  # Home — search, filters, school cards
    layout.tsx                # Root layout: NavBar + InstantDB provider
    schools/[id]/page.tsx     # School detail — financial snapshot + ROI metrics
    compare/page.tsx          # Side-by-side comparison table
    shortlist/page.tsx        # Saved work (requires login)
    login/page.tsx            # Magic-link login flow
    api/schools/route.ts      # API: search/filter or fetch by id from schools.json
  components/
    school-card.tsx           # Card used on the home search results grid
    school-search-filters.tsx # Search bar + state + public/private filters
    nav-bar.tsx               # Top nav with auth state
    InfoTooltip.tsx           # Hover/click tooltip (portal-based, viewport-clamped)
    instantdb-provider.tsx    # Wraps app in InstantDB context
  lib/
    db.ts                     # InstantDB client singleton
    schools-store.ts          # In-memory cache for schools.json
    compareSelection.ts       # localStorage-backed compare selection state
    sample-schools.ts         # Fallback sample data (used if schools.json is empty)
data/
  schools.json                # Pre-built school records (committed)
  scorecard.csv               # Raw College Scorecard export (source for build script)
  colleges.json               # Intermediate JSON from excel-to-json step (untracked)
scripts/
  build-schools.mjs           # Main data build: CSV → schools.json
  excel-to-json.mjs           # Optional: XLSX → colleges.json
  seed.mjs                    # Optional: seed InstantDB with sample data
instant.schema.ts             # InstantDB entity schema
instant.perms.ts              # InstantDB access control rules
```

---

## Pages

### Home (`/`)
Search and filter colleges. Results appear as cards showing net price, debt, completion rate, and earnings at 10 years. Each card has:
- **View details** (primary) — goes to the school detail page
- **Compare** — adds the school to the in-session compare selection; a toast appears with a link to the Compare tab
- **Save / Remove** — only visible when logged in

### School detail (`/schools/[id]`)
Three cards: Financial snapshot, ROI & break-even estimates, and a collapsible "How to read" explainer. Each metric has an `ⓘ` tooltip. When logged in, a **Save / Remove** button appears top-right inline with the school name.

### Compare (`/compare`)
Side-by-side table of up to 4 schools. Schools are added via the Compare button on cards and stored in `localStorage`. When logged in with 2+ schools, a **Save this comparison** form appears. Opening `/compare?id=<comparison-id>` loads a previously saved comparison.

### Saved work (`/shortlist`)
Requires login — redirects to `/login` if not authenticated. Two columns: saved schools (with notes) and saved comparisons (with copy-link, edit, remove). The "Saved work" nav link dims and shows a "Login required" tooltip for logged-out users.

### Log in (`/login`)
Magic-link flow: enter email → receive 6-digit code → verify. No passwords stored anywhere.

---

## Data schema (`data/schools.json`)

Each school object contains:

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (from Scorecard UNITID) |
| `name` | string | Institution name |
| `state` | string | Two-letter state code |
| `isPublic` | boolean | Public vs. private |
| `netPrice` | number | Avg. annual net price after aid |
| `medianDebt` | number | Median federal loan balance at graduation |
| `completionRate` | number | Graduation rate (%) |
| `earlyCareerEarnings` | number | Median earnings ~2 yrs after graduation |
| `earningsAt10Yrs` | number | Median earnings 10 yrs after entry |
| `institutionId` | string | Raw UNITID from Scorecard |
| `debtWithInterest10Yrs` | number | Derived: `medianDebt × 1.5` (5% simple interest × 10 yrs) |
| `earningsPremium10Yrs` | number | Derived: 10-yr earnings − (4 × netPrice) − debtWithInterest |
| `roiSimple` | number \| null | Alias for earningsPremium10Yrs |
| `breakEvenYears` | number \| null | Derived: total cost ÷ annual earnings premium |

Derived fields assume 4-year completion and 5% simple interest. The website displays them as estimates, not guarantees.

---

## Known limitations / not implemented

- **No automated tests.** No Jest, Vitest, or Playwright setup exists.
- **No rate limiting** on `/api/schools`. Fine for current usage; would need middleware before scaling.
- **No cache headers** on API responses. Browser/CDN caching is not configured.
- **InstantDB App ID is hardcoded.** Works fine; could be moved to an env var if multi-environment deployment is needed.
- **Major-level data not implemented.** The original vision includes program/major comparisons (e.g. Mechanical Engineering at UD vs. Rutgers). The Scorecard dataset supports this but it has not been built.

---

## Running without InstantDB

The core features — search, school detail, and in-session compare — work entirely from `data/schools.json` with no external services. Login and Saved work are the only features that require InstantDB. To strip them out, remove the InstantDB provider from `layout.tsx`, delete the `shortlist/` and `login/` pages, and remove auth-dependent UI from the nav, cards, and detail page.
