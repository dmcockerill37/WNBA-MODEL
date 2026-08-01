import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// POST /api/placed-bets - place a bet (checkbox checked)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    player_name,
    stat_category,
    selection_type,
    sportsbook,
    line,
    game_date,
    event_id,
    odds_american,
    wager,
  } = body;

  if (!player_name || !stat_category || !selection_type || !sportsbook || line == null || !game_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const rows = await sql`
      INSERT INTO placed_bets (
        player_name, stat_category, selection_type, sportsbook,
        line, game_date, event_id, odds_american, wager
      ) VALUES (
        ${player_name}, ${stat_category}, ${selection_type}, ${sportsbook},
        ${line}, ${game_date}, ${event_id ?? null}, ${odds_american ?? null}, ${wager ?? null}
      )
      ON CONFLICT (player_name, stat_category, selection_type, sportsbook, line, game_date)
      DO UPDATE SET wager = EXCLUDED.wager
      RETURNING id
    `;
    return NextResponse.json({ id: rows[0].id });
  } catch (err) {
    console.error("placed-bets POST error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

// DELETE /api/placed-bets - unplace a bet (checkbox unchecked)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const player_name = searchParams.get("player_name");
  const stat_category = searchParams.get("stat_category");
  const selection_type = searchParams.get("selection_type");
  const sportsbook = searchParams.get("sportsbook");
  const line = searchParams.get("line");
  const game_date = searchParams.get("game_date");

  if (!player_name || !stat_category || !selection_type || !sportsbook || !line || !game_date) {
    return NextResponse.json({ error: "Missing required params" }, { status: 400 });
  }

  try {
    await sql`
      DELETE FROM placed_bets
      WHERE player_name = ${player_name}
        AND stat_category = ${stat_category}
        AND selection_type = ${selection_type}
        AND sportsbook = ${sportsbook}
        AND line = ${parseFloat(line)}
        AND game_date = ${game_date}
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("placed-bets DELETE error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

// PATCH /api/placed-bets - update wager or notes
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, wager, notes } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await sql`
      UPDATE placed_bets
      SET wager = ${wager ?? null}, notes = ${notes ?? null}
      WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("placed-bets PATCH error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
