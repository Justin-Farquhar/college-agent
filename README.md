# College Agent

College Agent is a Next.js app that helps students compare colleges using the U.S. Department of Education College Scorecard dataset. You run **one build script** on your data file; the **website queries** that pre-built data for schools. Optional **login** (magic link) unlocks **Saved work**: per-user saved schools, saved comparisons, and personal notes—stored in InstantDB.

## Architecture

1. **Build (one-time, on your machine)**  
   Put the College Scorecard CSV in `data/scorecard.csv`, then run:
   ```bash
   npm run data:build
   ```
   The script reads the CSV, normalizes fields, **computes derived stats** (ROI, break-even, debt-with-interest), and writes `data/schools.json`.

2. **Website**  
   - **School data**: Search and filters use `GET /api/schools?q=...&state=...&isPublic=...`, which reads from `data/schools.json` (cached in memory). Detail and compare pages load schools by `id` from the same API. No database required for the school list.
   - **Saved work** (optional): When users log in (magic-link email via InstantDB), they can save schools and comparisons and add personal notes. That data lives in InstantDB and is tied to their account.

So: **dataset in a file → script builds one JSON with raw + derived data → website queries that file.** Saved schools, comparisons, and notes are stored in InstantDB and only used when the user is logged in.

## Tech stack

- **Framework**: Next.js (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **School data**: Static file `data/schools.json` + API route that searches/filters it
- **Auth & saved work**: InstantDB (magic-link login, saved schools, saved comparisons, notes)

## Getting started

1. **Install**
   ```bash
   npm install
   ```
   Place your College Scorecard CSV at `data/scorecard.csv`, then build the school data:
   ```bash
   npm run data:build
   ```
   You should see output like: `Wrote N schools to data/schools.json`.

2. **Run the app**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`. Search by school name and/or filter by state and public/private. Results come from the pre-built data.

3. **Saved work (optional)**  
   Use **Log in** in the nav to sign in with a magic-link email (InstantDB). Once logged in, you can save schools and comparisons to **Saved work** and add personal notes. The app is fully usable without logging in; search, compare, and school details all work.

## Script: `npm run data:build`

- **Input**: `data/scorecard.csv` (or `data/colleges.json` from an earlier convert step).
- **Output**: `data/schools.json` — one object per school with:
  - Normalized fields: `id`, `name`, `state`, `isPublic`, `netPrice`, `medianDebt`, `completionRate`, `earlyCareerEarnings`, `earningsAt10Yrs`, `institutionId`
  - **Derived (pre-computed)**: `debtWithInterest10Yrs`, `earningsPremium10Yrs`, `roiSimple`, `breakEvenYears` (based on 4-year completion and 5% simple interest on debt).

The website only reads and displays these; it does not compute them.

## API

- `GET /api/schools?q=...&state=...&isPublic=...&limit=200` — search/filter; returns an array of schools.
- `GET /api/schools?id=...` — fetch a single school by id (for detail and compare).

## Pages

- **Home (`/`)**  
  Search and filters; click Search to load results. Each card shows key metrics (net price, debt, completion, earnings @10 yrs) and:
  - **View details** — single-school page with full metrics and tooltips.
  - **Compare** — add the school to the compare selection (stored in the browser); a toast confirms “Added to Compare tab”.
  - **Save to saved work** / **Remove from saved work** — when logged in, save or remove the school from your list.

- **School detail (`/schools/[id]`)**  
  Financial snapshot and pre-computed ROI / break-even for one school, with inline explanations. When logged in, you can **Save to saved work** or **Remove from saved work**.

- **Compare (`/compare`)**  
  Side-by-side table of selected schools. Add schools via the Compare button on cards; remove from the table as needed. When logged in and you have two or more schools:
  - **Save this comparison** — give it a name and optional notes; it appears in Saved work.
  - When viewing a comparison you previously saved (e.g. via a link from Saved work), **Remove this comparison from saved work** is available if you own it.
  - Opening `/compare?id=<saved-comparison-id>` loads that saved comparison and shows the same table.

- **Saved work (`/shortlist`)**  
  Requires login. Two sections:
  - **Saved schools** — each with a link to the school detail, **Add/Edit notes**, and **Remove**.
  - **Saved comparisons** — each with a link to **View comparison** (opens the compare page with those schools), **Copy link**, **Add notes** / **Edit** (name and notes), and **Remove**.

- **Log in (`/login`)**  
  Magic-link auth: enter email, receive a 6-digit code, then verify. No password. Powered by InstantDB.

## Optional: Running without InstantDB

The app is configured to use InstantDB for auth and saved work. The core flow—search, school details, and compare (in-session)—only uses `data/schools.json` and `/api/schools`. If you do not need login or saved work, you could remove or stub the InstantDB dependency and the Saved work / Login UI; the rest of the app would still work.
