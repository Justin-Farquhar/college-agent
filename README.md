# College Agent

College Agent is a Next.js app that helps students compare colleges using the U.S. Department of Education College Scorecard dataset. You run **one build script** on your data file; the **website only queries** that pre-built data. No seeding in the browser, no separate import step.

## Architecture

1. **Build (one-time, on your machine)**  
   Put the College Scorecard CSV in `data/scorecard.csv`, then run:
   ```bash
   npm run data:build
   ```
   The script reads the CSV, normalizes fields, **computes derived stats** (ROI, break-even, debt-with-interest), and writes `data/schools.json`.

2. **Website (query only)**  
   The app serves search and filters via `GET /api/schools?q=...&state=...&isPublic=...`, which reads from `data/schools.json` (cached in memory). You search → the API filters the file → results appear. Detail and compare pages load a school by `id` from the same API.

So: **dataset in a file → script builds one JSON with raw + derived data → website only queries that file.** No database required for the school list.

## Tech stack

- **Framework**: Next.js (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **School data**: Static file `data/schools.json` + API route that searches/filters it
- **Auth / shortlist** (optional): InstantDB

## Getting started

1. **Install and run the build**
   ```bash
   npm install
   ```
   Place your College Scorecard CSV at `data/scorecard.csv`, then:
   ```bash
   npm run data:build
   ```
   You should see: `Wrote N schools to data/schools.json`.

2. **Start the app**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`. Search by school name and/or filter by state and public/private. Results come from the pre-built data; no import step in the browser.

## Script: `npm run data:build`

- **Input**: `data/scorecard.csv` (or, if you prefer, `data/colleges.json` from an earlier convert step).
- **Output**: `data/schools.json` — one object per school with:
  - Normalized fields: `id`, `name`, `state`, `isPublic`, `netPrice`, `medianDebt`, `completionRate`, `earlyCareerEarnings`, `earningsAt10Yrs`, `institutionId`
  - **Derived (pre-computed)**: `debtWithInterest10Yrs`, `earningsPremium10Yrs`, `roiSimple`, `breakEvenYears` (based on 4-year completion and 5% simple interest on debt).

The website never computes these; it only reads and displays them.

## API

- `GET /api/schools?q=...&state=...&isPublic=...&limit=200` — search/filter; returns an array of schools.
- `GET /api/schools?id=...` — fetch a single school by id (for detail and compare).

## Pages

- **Home (`/`)** — Search and filters; click Search to load results from the API. Click a school for details or “Compare” to add it to the compare view.
- **School detail (`/schools/[id]`)** — Financial snapshot and pre-computed ROI / break-even.
- **Compare (`/compare?schools=id1,id2,...`)** — Side-by-side table of selected schools (from search result links).

## Optional: InstantDB

InstantDB is still in the project for **auth** and **shortlist/saved comparisons** if you want them. The main school list does not use it; it uses `data/schools.json` and `/api/schools` only.
