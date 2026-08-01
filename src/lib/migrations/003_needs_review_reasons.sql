-- PINNACLE_MISMATCH_PLAN Phase 4: persist pass-rule reason codes.
-- JSON array text, e.g. ["cal_swing_outlier","large_edge_no_pinnacle"].
-- Prefer running from Modeling data/migrations/003_*.sql if already applied.
-- Idempotent.

ALTER TABLE scan_snapshots ADD COLUMN IF NOT EXISTS needs_review_reasons TEXT;
