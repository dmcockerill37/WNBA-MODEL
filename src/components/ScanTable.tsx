"use client";

import { useState } from "react";
import { ScanRow, formatOdds, formatEdge, formatEvent, formatEventMeta, statLabel, bookLabel, edgeTier, EdgeTier } from "@/lib/types";
import TierBadge from "./TierBadge";
import Drawer from "./Drawer";

const TIER_COLOR: Record<EdgeTier, string> = {
  S: "#a78bfa",
  A: "#34d399",
  B: "#60a5fa",
  C: "#fbbf24",
  D: "#fb923c",
  F: "#f87171",
};

interface Props {
  rows: ScanRow[];
  gameDate: string;
  placedKeys: Set<string>;
}

function betKey(row: ScanRow): string {
  return `${row.player_name}|${row.stat_category}|${row.selection_type}|${row.sportsbook}|${row.line}|${row.snapshot_game_date}`;
}

export default function ScanTable({ rows, gameDate, placedKeys: initialPlaced }: Props) {
  const [placed, setPlaced] = useState<Set<string>>(new Set(initialPlaced));
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [drawerRow, setDrawerRow] = useState<ScanRow | null>(null);

  const clean = rows.filter((r) => !r.needs_review);
  const review = rows.filter((r) => r.needs_review);

  async function togglePlaced(row: ScanRow, e: React.MouseEvent) {
    e.stopPropagation();
    const key = betKey(row);
    if (loadingKeys.has(key)) return;

    setLoadingKeys((prev) => new Set([...prev, key]));
    const isPlaced = placed.has(key);

    try {
      if (isPlaced) {
        const params = new URLSearchParams({
          player_name: row.player_name,
          stat_category: row.stat_category,
          selection_type: row.selection_type,
          sportsbook: row.sportsbook,
          line: String(row.line),
          game_date: row.snapshot_game_date,
        });
        const res = await fetch(`/api/placed-bets?${params}`, { method: "DELETE" });
        if (res.ok) {
          setPlaced((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        }
      } else {
        const res = await fetch("/api/placed-bets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player_name: row.player_name,
            stat_category: row.stat_category,
            selection_type: row.selection_type,
            sportsbook: row.sportsbook,
            line: row.line,
            game_date: row.snapshot_game_date,
            event_id: null,
            odds_american: row.odds_american,
          }),
        });
        if (res.ok) {
          setPlaced((prev) => new Set([...prev, key]));
        }
      }
    } finally {
      setLoadingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  function renderSection(sectionRows: ScanRow[], label: string, accent: string) {
    if (sectionRows.length === 0) return null;
    return (
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: accent,
            textTransform: "uppercase",
            marginBottom: "8px",
            padding: "0 4px",
          }}
        >
          {label} ({sectionRows.length})
        </div>
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["", "Player", "Stat", "Side", "Line", "Event", "Tier", "Edge", "Book", "Book odds", "Pinnacle", "Model odds", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "10px 14px",
                        textAlign: i === 0 ? "center" : i >= 6 ? "right" : "left",
                        color: "var(--text-muted)",
                        fontWeight: 500,
                        fontSize: "11px",
                        letterSpacing: "0.05em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {sectionRows.map((row, idx) => {
                const key = betKey(row);
                const isPlaced = placed.has(key);
                const isLoading = loadingKeys.has(key);
                const tier = edgeTier(row.edge);
                const eventMeta = formatEventMeta(row);
                const modelAmerican = row.model_probability
                  ? row.model_probability >= 0.5
                    ? Math.round(-100 * row.model_probability / (1 - row.model_probability))
                    : Math.round(100 * (1 - row.model_probability) / row.model_probability)
                  : null;

                return (
                  <tr
                    key={`${row.player_name}-${row.stat_category}-${row.selection_type}-${row.sportsbook}-${row.line}`}
                    onClick={() => setDrawerRow(row)}
                    style={{
                      borderTop: idx > 0 ? "1px solid var(--border-subtle, #111827)" : undefined,
                      cursor: "pointer",
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg-card-hover)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = "";
                    }}
                  >
                    {/* checkbox */}
                    <td style={{ padding: "10px 8px 10px 14px", textAlign: "center", width: "40px" }}>
                      <button
                        onClick={(e) => togglePlaced(row, e)}
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: isPlaced ? "none" : "1.5px solid #374151",
                          background: isPlaced ? "#34d399" : "transparent",
                          cursor: isLoading ? "wait" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: isLoading ? 0.5 : 1,
                          transition: "all 0.15s ease",
                        }}
                        title={isPlaced ? "Remove from tracker" : "Track this bet"}
                      >
                        {isPlaced && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#0a0e17" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    </td>
                    {/* player */}
                    <td style={{ padding: "10px 14px", fontWeight: 500, color: "var(--text-primary)" }}>
                      {row.player_name}
                    </td>
                    {/* stat */}
                    <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>
                      {statLabel(row.stat_category)}
                    </td>
                    {/* side */}
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          color: row.selection_type === "over" ? "#60a5fa" : "#fb923c",
                          background: row.selection_type === "over" ? "rgba(96,165,250,0.12)" : "rgba(251,146,60,0.12)",
                          borderRadius: "4px",
                          padding: "2px 7px",
                          fontSize: "11px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        {row.selection_type}
                      </span>
                    </td>
                    {/* line */}
                    <td style={{ padding: "10px 14px", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                      {row.line}
                    </td>
                    {/* event */}
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                        {formatEvent(row)}
                      </div>
                      {eventMeta && (
                        <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "2px" }}>
                          {eventMeta}
                        </div>
                      )}
                    </td>
                    {/* tier */}
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <TierBadge edge={row.edge} />
                    </td>
                    {/* edge */}
                    <td
                      style={{
                        padding: "10px 14px",
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 600,
                        color: TIER_COLOR[tier],
                      }}
                    >
                      {formatEdge(row.edge)}
                    </td>
                    {/* book */}
                    <td style={{ padding: "10px 14px", textAlign: "right", color: "var(--text-secondary)", fontSize: "12px" }}>
                      {bookLabel(row.sportsbook)}
                    </td>
                    {/* book odds */}
                    <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>
                      {row.odds_american != null ? formatOdds(row.odds_american) : "--"}
                    </td>
                    {/* pinnacle / fair value */}
                    <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>
                      {row.fair_value_odds != null && row.fair_value_source === "pinnacle"
                        ? formatOdds(row.fair_value_odds)
                        : "--"}
                    </td>
                    {/* model odds */}
                    <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--accent)" }}>
                      {modelAmerican != null ? formatOdds(modelAmerican) : "--"}
                    </td>
                    {/* flags */}
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      {row.needs_review && (
                        <span style={{ color: "#fbbf24", fontSize: "11px" }}>review</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      {renderSection(clean, "Clean", "#34d399")}
      {renderSection(review, "Needs Review", "#fbbf24")}

      {drawerRow && (
        <Drawer row={drawerRow} onClose={() => setDrawerRow(null)} />
      )}
    </div>
  );
}
