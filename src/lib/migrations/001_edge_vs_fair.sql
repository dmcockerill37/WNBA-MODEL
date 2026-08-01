-- Model 2.0 Phase 1: dual edge columns on scan_snapshots.
-- Run once against Neon (SQL editor or psql). Idempotent.
--
-- edge          → primary rank key = model − fair/devigged (written by Python)
-- edge_vs_fair  → explicit copy of that primary edge (NULL on pre-Phase-1 rows)
-- raw_book_edge → soft-book implied (with vig) diagnostic only

ALTER TABLE scan_snapshots ADD COLUMN IF NOT EXISTS edge_vs_fair REAL;
ALTER TABLE scan_snapshots ADD COLUMN IF NOT EXISTS raw_book_edge REAL;
