import { sql } from "./db";
import { betKey } from "./betKey";
import { ScanRow, PlacedBet, HistoryRow } from "./types";

function parseReviewReasons(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return s.split(",").map((x) => x.trim()).filter(Boolean);
    }
  }
  return [];
}

export async function getScanRows(gameDate: string, league = "wnba"): Promise<ScanRow[]> {
  try {
    // Match dated snapshots plus undated ("all") rows whose tip-off falls on
    // this Eastern calendar date. Dedupe prefers the dated snapshot.
    const rows = await sql`
      SELECT *
      FROM (
        SELECT DISTINCT ON (
          ss.player_name, ss.stat_category, ss.selection_type, ss.sportsbook, ss.line
        )
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
                bj.event_start_time IS NOT NULL
                AND (bj.event_start_time::timestamptz AT TIME ZONE 'America/New_York')::date::text
                  = ${gameDate}
              )
            )
          ORDER BY bj.resolved_at DESC NULLS LAST, bj.id DESC
          LIMIT 1
        ) bj ON true
        WHERE ss.league = ${league}
          AND (
            ss.snapshot_game_date = ${gameDate}
            OR (
              ss.event_start_time IS NOT NULL
              AND (ss.event_start_time::timestamptz AT TIME ZONE 'America/New_York')::date::text
                = ${gameDate}
            )
          )
        ORDER BY
          ss.player_name, ss.stat_category, ss.selection_type, ss.sportsbook, ss.line,
          CASE WHEN ss.snapshot_game_date = ${gameDate} THEN 0 ELSE 1 END,
          ss.snapshot_taken_at DESC
      ) ranked
      ORDER BY needs_review ASC, edge DESC
    `;
    return rows.map((r) => ({
      ...r,
      needs_review: r.needs_review === 1 || r.needs_review === true,
      needs_review_reasons: parseReviewReasons(r.needs_review_reasons),
      result_status: (r.result_status as ScanRow["result_status"]) ?? null,
      result_actual_value:
        r.result_actual_value != null ? Number(r.result_actual_value) : null,
    })) as ScanRow[];
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
      rows.map((r) =>
        betKey({
          player_name: String(r.player_name),
          stat_category: String(r.stat_category),
          selection_type: String(r.selection_type),
          sportsbook: String(r.sportsbook),
          line: r.line as number | string,
          game_date: r.game_date as string | Date,
        })
      )
    );
  } catch {
    return new Set();
  }
}

function mapPlacedBet(r: Record<string, unknown>): PlacedBet {
  return {
    ...(r as unknown as PlacedBet),
    edge_at_flag: r.edge_at_flag != null ? Number(r.edge_at_flag) : null,
    clv_probability: r.clv_probability != null ? Number(r.clv_probability) : null,
    result_actual_value:
      r.result_actual_value != null ? Number(r.result_actual_value) : null,
    result_status: (r.result_status as PlacedBet["result_status"]) ?? null,
    closing_odds_american:
      r.closing_odds_american != null ? Number(r.closing_odds_american) : null,
  };
}

export async function getPlacedBets(): Promise<PlacedBet[]> {
  // Prefer journal enrichment for CLV/result. If that join fails (bad
  // event_start_time text, etc.), fall back so tracked bets still appear.
  try {
    const rows = await sql`
      SELECT
        pb.*,
        bj.result_status,
        bj.result_actual_value,
        bj.clv_probability,
        bj.closing_odds_american,
        bj.edge_at_flag
      FROM placed_bets pb
      LEFT JOIN LATERAL (
        SELECT
          result_status,
          result_actual_value,
          clv_probability,
          closing_odds_american,
          edge_at_flag
        FROM bet_journal bj
        WHERE bj.player_name = pb.player_name
          AND bj.stat_category = pb.stat_category
          AND bj.selection_type = pb.selection_type
          AND bj.sportsbook = pb.sportsbook
          AND (
            bj.flagged_line IS NULL
            OR ABS(bj.flagged_line - pb.line) < 0.01
          )
          AND bj.event_start_time IS NOT NULL
          AND bj.event_start_time ~ '^[0-9]{4}-'
          AND (bj.event_start_time::timestamptz AT TIME ZONE 'America/New_York')::date::text
            = pb.game_date
        ORDER BY bj.resolved_at DESC NULLS LAST, bj.id DESC
        LIMIT 1
      ) bj ON true
      ORDER BY pb.game_date DESC, pb.placed_at DESC
    `;
    return rows.map((r) => mapPlacedBet(r as Record<string, unknown>));
  } catch (err) {
    console.error("getPlacedBets join error, falling back:", err);
  }

  try {
    const rows = await sql`
      SELECT *
      FROM placed_bets
      ORDER BY game_date DESC, placed_at DESC
    `;
    return rows.map((r) =>
      mapPlacedBet({
        ...r,
        result_status: null,
        result_actual_value: null,
        clv_probability: null,
        closing_odds_american: null,
        edge_at_flag: null,
      } as Record<string, unknown>)
    );
  } catch (err) {
    console.error("getPlacedBets error:", err);
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
      needs_review_reasons: parseReviewReasons(r.needs_review_reasons),
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
