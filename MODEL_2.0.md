# Model 2.0

Working branch for dialing in the WNBA prop model and killing inflated edges.

**Primary plan (Python model):** [`../Modeling/MODEL_2.0_PLAN.md`](../Modeling/MODEL_2.0_PLAN.md)

**Pinnacle mismatch continuation:** [`../Modeling/PINNACLE_MISMATCH_PLAN.md`](../Modeling/PINNACLE_MISMATCH_PLAN.md) — why rows like Vandersloot −1426 vs Pin −123 appear (calibration OOD + Poisson σ-ignore), and the fix phases.

This dashboard repo only displays Neon `scan_snapshots`. Model 2.0 math lives in `Modeling/` (`propmodel` / `model`). Dashboard work lands in **Phase 5** (edge-vs-fair display, tier sync, CLV-by-tier on Tracker) and mismatch **Phase 4** (raw/cal Drawer + review reasons).

**Phase 1 UI (shipped early):** Drawer shows dual-edge — primary via `primaryEdge()` (`edge_vs_fair` when present, else legacy `edge`) labeled "Edge vs fair" / "Edge (legacy)", plus `raw_book_edge` when available. Tables keep a neutral "Edge" column header.

## Branches

- `WNBA Model` → `model-2.0`
- `Modeling` → `model-2.0`
