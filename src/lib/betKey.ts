/** Stable identity for a placed bet across scan UI and DB reads. */
export function betKey(parts: {
  player_name: string;
  stat_category: string;
  selection_type: string;
  sportsbook: string;
  line: number | string;
  game_date: string | Date;
}): string {
  const line = typeof parts.line === "number" ? parts.line : Number(parts.line);
  const gameDate =
    parts.game_date instanceof Date
      ? parts.game_date.toLocaleDateString("en-CA", { timeZone: "America/New_York" })
      : String(parts.game_date).slice(0, 10);
  return `${parts.player_name}|${parts.stat_category}|${parts.selection_type}|${parts.sportsbook}|${line}|${gameDate}`;
}
