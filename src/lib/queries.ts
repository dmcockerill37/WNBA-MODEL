import { sql } from "./db";
import { ScanRow, PlacedBet } from "./types";

export async function getScanRows(gameDate: string, league = "wnba"): Promise<ScanRow[]> {
  const rows = await sql`
    SELECT *
    FROM scan_snapshots
    WHERE league = ${league}
      AND snapshot_game_date = ${gameDate}
    ORDER BY needs_review ASC, edge DESC
  `;
  return rows.map((r) => ({ ...r, needs_review: r.needs_review === 1 || r.needs_review === true })) as ScanRow[];
}

export async function getPlacedKeys(gameDate: string): Promise<Set<string>> {
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
}

export async function getPlacedBets(): Promise<PlacedBet[]> {
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
}

export async function getHistoryRows(limit = 200): Promise<ScanRow[]> {
  const rows = await sql`
    SELECT *
    FROM scan_snapshots
    WHERE needs_review = 0
    ORDER BY snapshot_game_date DESC, edge DESC
    LIMIT ${limit}
  `;
  return rows as ScanRow[];
}

export async function getAvailableDates(league = "wnba"): Promise<string[]> {
  const rows = await sql`
    SELECT DISTINCT snapshot_game_date
    FROM scan_snapshots
    WHERE league = ${league}
    ORDER BY snapshot_game_date DESC
    LIMIT 30
  `;
  return rows.map((r) => r.snapshot_game_date as string);
}
