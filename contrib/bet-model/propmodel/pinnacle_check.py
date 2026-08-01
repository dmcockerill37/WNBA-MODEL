"""Fill Pinnacle fair value on prior scan rows that missed it.

Used by the dashboard "Pinnacle odds check" action and
`python -m propmodel pinnacle-check wnba --date today`.

Loads scan_snapshots for a league+date where fair_value_source is not
already 'pinnacle', scrapes the current Pinnacle slate once, matches each
row, then updates fair fields + edge_vs_fair on the primary DB and Neon.
"""

from __future__ import annotations

import logging
import os
from datetime import date

from propmodel.dates import resolve_date
from propmodel.pinnacle_match import get_pinnacle_lines, match_pinnacle_fair_value
from stats.db import get_connection

log = logging.getLogger(__name__)


def _american_to_implied(odds: int | float | None) -> float | None:
    if odds is None:
        return None
    o = float(odds)
    if o > 0:
        return 100.0 / (o + 100.0)
    if o < 0:
        return abs(o) / (abs(o) + 100.0)
    return None


def _neon_conn():
    url = os.environ.get("NEON_DATABASE_URL")
    if not url:
        return None
    import psycopg2
    import psycopg2.extras

    return psycopg2.connect(url, cursor_factory=psycopg2.extras.RealDictCursor)


_UPDATE_SQL = """
    UPDATE scan_snapshots SET
        fair_probability = %(fair_probability)s,
        fair_value_odds = %(fair_value_odds)s,
        fair_value_source = %(fair_value_source)s,
        pinnacle_divergence = %(pinnacle_divergence)s,
        model_pinnacle_divergence = %(model_pinnacle_divergence)s,
        edge = %(edge)s,
        edge_vs_fair = %(edge_vs_fair)s
    WHERE id = %(id)s
"""

_NEON_UPSERT_SQL = """
    INSERT INTO scan_snapshots (
        league, snapshot_game_date, snapshot_taken_at,
        player_name, stat_category, selection_type, sportsbook, line,
        odds_american, model_probability, edge, needs_review,
        fair_probability, fair_value_odds, fair_value_source,
        pinnacle_divergence, model_pinnacle_divergence,
        edge_vs_fair, raw_book_edge,
        event_start_time, away_team, home_team,
        away_abbreviation, home_abbreviation, player_team
    ) VALUES (
        %(league)s, %(snapshot_game_date)s, %(snapshot_taken_at)s,
        %(player_name)s, %(stat_category)s, %(selection_type)s, %(sportsbook)s, %(line)s,
        %(odds_american)s, %(model_probability)s, %(edge)s, %(needs_review)s,
        %(fair_probability)s, %(fair_value_odds)s, %(fair_value_source)s,
        %(pinnacle_divergence)s, %(model_pinnacle_divergence)s,
        %(edge_vs_fair)s, %(raw_book_edge)s,
        %(event_start_time)s, %(away_team)s, %(home_team)s,
        %(away_abbreviation)s, %(home_abbreviation)s, %(player_team)s
    )
    ON CONFLICT (league, snapshot_game_date, player_name, stat_category, selection_type, sportsbook, line)
    DO UPDATE SET
        fair_probability = EXCLUDED.fair_probability,
        fair_value_odds = EXCLUDED.fair_value_odds,
        fair_value_source = EXCLUDED.fair_value_source,
        pinnacle_divergence = EXCLUDED.pinnacle_divergence,
        model_pinnacle_divergence = EXCLUDED.model_pinnacle_divergence,
        edge = EXCLUDED.edge,
        edge_vs_fair = EXCLUDED.edge_vs_fair
"""


def run_pinnacle_check(
    league: str = "wnba",
    game_date: str | date = "today",
) -> dict:
    """Re-match Pinnacle fair for snapshot rows missing it.

    Returns counts: checked, matched, still_missing, neon_mirrored.
    """
    resolved = resolve_date(game_date) if isinstance(game_date, str) else game_date
    date_et = resolved.isoformat()

    # Warm the process-wide Pinnacle cache once.
    lines = get_pinnacle_lines(league)
    if not lines:
        log.warning("Pinnacle slate empty or unreachable; nothing to match")
        return {
            "league": league,
            "game_date": date_et,
            "checked": 0,
            "matched": 0,
            "still_missing": 0,
            "neon_mirrored": 0,
            "pinnacle_lines": 0,
        }

    conn = get_connection()
    try:
        rows = conn.execute(
            """
            SELECT *
            FROM scan_snapshots
            WHERE league = %s
              AND snapshot_game_date = %s
              AND (fair_value_source IS DISTINCT FROM 'pinnacle')
            ORDER BY edge DESC NULLS LAST, id
            """,
            (league, date_et),
        ).fetchall()
    finally:
        conn.close()

    updates: list[dict] = []
    still_missing = 0

    for raw in rows:
        row = dict(raw)
        model_p = row.get("model_probability")
        if model_p is None:
            still_missing += 1
            continue

        match = match_pinnacle_fair_value(
            league,
            row["player_name"],
            row["stat_category"],
            float(row["line"]),
            row["selection_type"],
            teams=(row.get("home_team"), row.get("away_team")),
        )
        if match is None:
            still_missing += 1
            continue

        fair_p = match["fair_probability"]
        market_p = _american_to_implied(row.get("odds_american"))
        edge_vs_fair = float(model_p) - float(fair_p)

        updates.append(
            {
                **row,
                "id": row["id"],
                "fair_probability": fair_p,
                "fair_value_odds": match["fair_value_odds"],
                "fair_value_source": match.get("source") or "pinnacle",
                "pinnacle_divergence": (
                    abs(float(market_p) - float(fair_p)) if market_p is not None else None
                ),
                "model_pinnacle_divergence": abs(float(model_p) - float(fair_p)),
                # Model 2.0: primary edge column stores edge_vs_fair.
                "edge": edge_vs_fair,
                "edge_vs_fair": edge_vs_fair,
            }
        )

    if updates:
        conn = get_connection()
        try:
            with conn:
                cur = conn.cursor()
                for u in updates:
                    cur.execute(_UPDATE_SQL, u)
        finally:
            conn.close()

    neon_mirrored = 0
    neon = _neon_conn()
    if neon is not None and updates:
        try:
            with neon:
                cur = neon.cursor()
                for u in updates:
                    cur.execute(_NEON_UPSERT_SQL, u)
                    neon_mirrored += 1
        except Exception as exc:
            log.warning("Neon pinnacle-check mirror failed (non-fatal): %s", exc)
            neon_mirrored = 0
        finally:
            neon.close()
    elif updates and neon is None:
        log.warning("NEON_DATABASE_URL unset; skipped Neon mirror")

    return {
        "league": league,
        "game_date": date_et,
        "checked": len(rows),
        "matched": len(updates),
        "still_missing": still_missing,
        "neon_mirrored": neon_mirrored,
        "pinnacle_lines": len(lines),
    }


def print_pinnacle_check(result: dict) -> None:
    print(
        f"Pinnacle check {result['league'].upper()} {result['game_date']}: "
        f"checked={result['checked']} matched={result['matched']} "
        f"still_missing={result['still_missing']} "
        f"neon_mirrored={result['neon_mirrored']} "
        f"(pinnacle_lines={result['pinnacle_lines']})"
    )
