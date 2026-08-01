-- Model 2.0 Phase 3/5: persist raw + calibrated model side-probabilities.
-- Prefer running from Modeling data/migrations/002_*.sql if already applied.
-- Idempotent. No new columns needed for tracker (uses bet_journal.edge_at_flag).

ALTER TABLE scan_snapshots ADD COLUMN IF NOT EXISTS raw_model_probability REAL;
ALTER TABLE scan_snapshots ADD COLUMN IF NOT EXISTS calibrated_model_probability REAL;
