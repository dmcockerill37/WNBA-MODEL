-- Ported from the propmodel SQLite schema for Neon (Postgres).
-- Run this once against your Neon database to set up all tables.

-- placed_bets: bets the user has manually marked as placed via the dashboard.
-- Separate from bet_journal (which the Python model manages for CLV tracking)
-- so that journaling and placement tracking are independent concerns.
CREATE TABLE IF NOT EXISTS placed_bets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    player_name TEXT NOT NULL,
    stat_category TEXT NOT NULL,
    selection_type TEXT NOT NULL,
    sportsbook TEXT NOT NULL,
    line REAL NOT NULL,
    game_date TEXT NOT NULL,
    event_id TEXT,
    odds_american INTEGER,
    wager DECIMAL(10,2),
    placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    UNIQUE (player_name, stat_category, selection_type, sportsbook, line, game_date)
);

-- scan_snapshots: full scan output preserved for historical review. Written by
-- the Python model via propmodel/scan.py. One row per comparison
-- (player/stat/side/book/line) at the time the scan ran.
CREATE TABLE IF NOT EXISTS scan_snapshots (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    league TEXT NOT NULL,
    snapshot_game_date TEXT NOT NULL,
    snapshot_taken_at TEXT NOT NULL,
    player_name TEXT NOT NULL,
    stat_category TEXT NOT NULL,
    selection_type TEXT NOT NULL,
    sportsbook TEXT NOT NULL,
    line REAL,
    odds_american INTEGER,
    model_probability REAL,
    edge REAL,
    needs_review INTEGER NOT NULL DEFAULT 0,
    projection_mean REAL,
    projection_std REAL,
    distribution_type TEXT,
    n_games_used INTEGER,
    unshrunk_mean REAL,
    line_spread REAL,
    workload_flag TEXT,
    pinnacle_divergence REAL,
    model_pinnacle_divergence REAL,
    fair_probability REAL,
    fair_value_odds INTEGER,
    fair_value_source TEXT,
    -- Model 2.0 Phase 1: edge column stores edge_vs_fair (primary rank key);
    -- raw_book_edge is soft-book implied (with vig) for diagnostics only.
    edge_vs_fair REAL,
    raw_book_edge REAL,
    matchup_json TEXT,
    event_start_time TEXT,
    away_team TEXT,
    home_team TEXT,
    away_abbreviation TEXT,
    home_abbreviation TEXT,
    player_team TEXT,
    UNIQUE (league, snapshot_game_date, player_name, stat_category, selection_type, sportsbook, line)
);

CREATE INDEX IF NOT EXISTS idx_scan_snapshots_date
    ON scan_snapshots (league, snapshot_game_date, edge DESC);

-- bet_journal: CLV tracking. Written by the Python model. One row per bet the
-- model flagged clean; resolve_closing_lines fills in closing price + CLV.
CREATE TABLE IF NOT EXISTS bet_journal (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    league TEXT NOT NULL,
    event_id TEXT,
    event_start_time TEXT,
    player_name TEXT NOT NULL,
    stat_category TEXT NOT NULL,
    selection_type TEXT NOT NULL,
    sportsbook TEXT NOT NULL,
    flagged_at TEXT NOT NULL,
    flagged_line REAL,
    flagged_odds_american INTEGER,
    flagged_probability REAL,
    model_probability REAL,
    edge_at_flag REAL,
    status TEXT NOT NULL DEFAULT 'open',
    closing_line REAL,
    closing_odds_american INTEGER,
    closing_probability REAL,
    clv_probability REAL,
    resolved_at TEXT,
    result_status TEXT,
    result_actual_value REAL,
    UNIQUE (league, event_id, sportsbook, player_name, stat_category, selection_type)
);

CREATE INDEX IF NOT EXISTS idx_bet_journal_status
    ON bet_journal (status, event_start_time);
