export type SelectionType = "over" | "under";
export type EdgeTier = "S" | "A" | "B" | "C" | "D" | "F";
export type ResultStatus = "won" | "lost" | "push" | null;

export interface ScanRow {
  id: number;
  league: string;
  snapshot_game_date: string;
  snapshot_taken_at: string;
  player_name: string;
  stat_category: string;
  selection_type: SelectionType;
  sportsbook: string;
  line: number;
  odds_american: number;
  model_probability: number;
  edge: number;
  needs_review: boolean;
  projection_mean: number | null;
  projection_std: number | null;
  distribution_type: string | null;
  n_games_used: number | null;
  unshrunk_mean: number | null;
  line_spread: number | null;
  workload_flag: string | null;
  pinnacle_divergence: number | null;
  model_pinnacle_divergence: number | null;
  fair_probability: number | null;
  fair_value_odds: number | null;
  fair_value_source: string | null;
  matchup_json: string | null;
  event_start_time: string | null;
  away_team: string | null;
  home_team: string | null;
  away_abbreviation: string | null;
  home_abbreviation: string | null;
  player_team: string | null;
}

export interface PlacedBet {
  id: number;
  player_name: string;
  stat_category: string;
  selection_type: SelectionType;
  sportsbook: string;
  line: number;
  game_date: string;
  event_id: string | null;
  odds_american: number | null;
  wager: number | null;
  placed_at: string;
  notes: string | null;
  // joined from bet_journal
  result_status: ResultStatus;
  result_actual_value: number | null;
  clv_probability: number | null;
  closing_odds_american: number | null;
}

export interface BetTrackerKPIs {
  total: number;
  won: number;
  lost: number;
  push: number;
  open: number;
  total_wagered: number;
  net_profit: number;
  roi: number;
  by_tier: Record<EdgeTier, { total: number; won: number; lost: number; push: number }>;
}

export function edgeTier(edge: number): EdgeTier {
  if (edge >= 0.15) return "S";
  if (edge >= 0.12) return "A";
  if (edge >= 0.09) return "B";
  if (edge >= 0.07) return "C";
  if (edge >= 0.05) return "D";
  return "F";
}

export function formatOdds(american: number): string {
  return american > 0 ? `+${american}` : `${american}`;
}

export function formatEdge(edge: number): string {
  return `${(edge * 100).toFixed(1)}%`;
}

export function statLabel(stat: string): string {
  const map: Record<string, string> = {
    points: "PTS",
    rebounds: "REB",
    assists: "AST",
    strikeouts_pitcher: "K",
    earned_runs: "ER",
    outs_pitcher: "OUTS",
  };
  return map[stat] ?? stat;
}

export function bookLabel(book: string): string {
  const map: Record<string, string> = {
    draftkings: "DK",
    fanduel: "FD",
    caesars: "CZR",
    novig: "NV",
    pinnacle: "PIN",
  };
  return map[book] ?? book;
}

export function formatEvent(row: Pick<ScanRow, "away_abbreviation" | "home_abbreviation" | "away_team" | "home_team">): string {
  const away = row.away_abbreviation || row.away_team;
  const home = row.home_abbreviation || row.home_team;
  if (!away || !home) return "--";
  return `${away} @ ${home}`;
}

export function formatEventTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatEventDate(isoDate: string | null): string | null {
  if (!isoDate || isoDate === "all") return null;
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Secondary event line: "Jul 31 · 7:00 PM" */
export function formatEventMeta(
  row: Pick<ScanRow, "snapshot_game_date" | "event_start_time">
): string | null {
  const date = formatEventDate(row.snapshot_game_date);
  const time = formatEventTime(row.event_start_time);
  if (date && time) return `${date} · ${time}`;
  return date ?? time;
}
