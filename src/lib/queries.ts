import { sql } from "./db";
import { ScanRow, PlacedBet, HistoryRow } from "./types";

export async function getScanRows(gameDate: string, league = "wnba"): Promise<ScanRow[]> {
  try {
    const rows = await sql`
      SELECT *
      FROM scan_snapshots
      WHERE league = ${league}
        AND snapshot_game_date = ${gameDate}
        AND snapshot_game_date != 'all'
      ORDER BY needs_review ASC, edge DESC
    `;
    return rows.map((r) => ({ ...r, needs_review: r.needs_review === 1 || r.needs_review === true })) as ScanRow[];
  } catch {
    return [];
  }
}

export async function getPlacedKeys(gameDate: string): Promise<Set<string>> {
  try {
    const rows = await sql`
      SELECT player_name, stat_category, selection_type, sportsbook, line, game_date
      FROM placed_bets
      WHERE game_date = ${gameDate}
    `;
    return new Set(
      rows.map(
        (r) =>
          `${r.player_name}|${r.stat_category}|${r.selection_type}|${r.sportsbook}|${r.line}|${r.game_date}`
      )
    );
  } catch {
    return new Set();
  }
}

export async function getPlacedBets(): Promise<PlacedBet[]> {
  try {
    const rows = await sql`
      SELECT
        pb.*,
        bj.result_status,
        bj.result_actual_value,
        bj.clv_probability,
        bj.closing_odds_american
      FROM placed_bets pb
      LEFT JOIN bet_journal bj
        ON bj.player_name = pb.player_name
        AND bj.stat_category = pb.stat_category
        AND bj.selection_type = pb.selection_type
        AND bj.sportsbook = pb.sportsbook
        AND DATE(bj.event_start_time) = pb.game_date
      ORDER BY pb.game_date DESC, pb.placed_at DESC
    `;
    return rows as PlacedBet[];
  } catch {
    return [];
  }
}

export async function getHistoryRows(limit = 200, league = "wnba"): Promise<HistoryRow[]> {
  try {
    const rows = await sql`
      SELECT
        ss.*,
        bj.result_status,
        bj.result_actual_value
      FROM scan_snapshots ss
      LEFT JOIN LATERAL (
        SELECT result_status, result_actual_value
        FROM bet_journal bj
        WHERE bj.league = ss.league
          AND bj.player_name = ss.player_name
          AND bj.stat_category = ss.stat_category
          AND bj.selection_type = ss.selection_type
          AND bj.sportsbook = ss.sportsbook
          AND (
            bj.flagged_line IS NULL
            OR ABS(bj.flagged_line - ss.line) < 0.01
          )
          AND (
            (
              ss.event_start_time IS NOT NULL
              AND bj.event_start_time IS NOT NULL
              AND bj.event_start_time = ss.event_start_time
            )
            OR (
              ss.snapshot_game_date IS NOT NULL
              AND ss.snapshot_game_date != 'all'
              AND bj.event_start_time IS NOT NULL
              AND (bj.event_start_time::timestamptz AT TIME ZONE 'America/New_York')::date::text
                = ss.snapshot_game_date
            )
          )
        ORDER BY bj.resolved_at DESC NULLS LAST, bj.id DESC
        LIMIT 1
      ) bj ON true
      WHERE ss.needs_review = 0
        AND ss.league = ${league}
      ORDER BY ss.event_start_time DESC NULLS LAST, ss.edge DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => ({
      ...r,
      needs_review: r.needs_review === 1 || r.needs_review === true,
      result_status: (r.result_status as HistoryRow["result_status"]) ?? null,
      result_actual_value:
        r.result_actual_value != null ? Number(r.result_actual_value) : null,
    })) as HistoryRow[];
  } catch {
    return [];
  }
}

export async function getAvailableDates(league = "wnba"): Promise<string[]> {
  try {
    const rows = await sql`
      SELECT DISTINCT snapshot_game_date
      FROM scan_snapshots
      WHERE league = ${league}
      ORDER BY snapshot_game_date DESC
      LIMIT 30
    `;
    return rows.map((r) => r.snapshot_game_date as string);
  } catch {
    return [];
  }
}
