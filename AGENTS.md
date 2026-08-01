<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Next.js 16 (App Router, Turbopack) dashboard for a WNBA prop-bet model. Standard commands live in `package.json` scripts: `npm run dev` (port 3000), `npm run lint`, `npm run build`, `npm run migrate`. There is no automated test suite.

Non-obvious things worth knowing:

- The app is backed entirely by a Neon (serverless Postgres) database via `DATABASE_URL`. `src/lib/db.ts` throws at import if `DATABASE_URL` is unset, so `npm run dev` / `npm run build` fail without it. Put `DATABASE_URL` in `.env.local` (gitignored via `.env*`); the documented workflow is `vercel env pull .env.local`.
- Reads in `src/lib/queries.ts` are wrapped in try/catch and return `[]` on any error, so a bad/unreachable DB makes pages render empty ("No scan data yet") instead of crashing. When a page is unexpectedly empty, check the dev-server logs or run the SQL from `src/lib/queries.ts` directly against the DB — the error is being swallowed.
- The app uses the Neon **HTTP** driver (`neon()`), which speaks Neon's HTTP SQL protocol, not the raw Postgres wire protocol. A plain local Postgres will NOT work with the default driver; point `DATABASE_URL` at a real Neon database. (To run against a local Postgres you must front it with a Neon HTTP proxy and override `neonConfig.fetchEndpoint` — only worth it for offline work.)
- Schema is in `src/lib/schema.sql`; `npm run migrate` applies it using the Neon driver + `.env.local`. Tables: `scan_snapshots` (model output), `placed_bets` (written by the `/api/placed-bets` route when a checkbox is toggled), `bet_journal` (CLV; written by a separate Python model repo, not this one).
- Bet-tracking flow to verify end to end: toggle a checkbox in the scan table on `/today` → POST `/api/placed-bets` → row in `placed_bets`; the checkbox stays green across reloads because pages re-read placed keys from the DB.
