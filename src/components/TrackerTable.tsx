"use client";

import { useState } from "react";
import { PlacedBet, formatOdds, statLabel, bookLabel } from "@/lib/types";
import Pagination, { PageSize, slicePage } from "./Pagination";

const RESULT_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  won: { color: "#34d399", bg: "rgba(52,211,153,0.12)", label: "W" },
  lost: { color: "#f87171", bg: "rgba(248,113,113,0.12)", label: "L" },
  push: { color: "#9ca3af", bg: "rgba(156,163,175,0.12)", label: "P" },
};

export default function TrackerTable({ bets }: { bets: PlacedBet[] }) {
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [page, setPage] = useState(1);
  const visible = slicePage(bets, page, pageSize);

  return (
    <div>
      <div style={{ background: "var(--bg-card)", borderRadius: "10px", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Date", "Player", "Stat", "Side", "Line", "Tier", "Book", "Odds", "Wager", "Result", "CLV", "Actual"].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      textAlign: i >= 4 ? "right" : "left",
                      color: "var(--text-muted)",
                      fontWeight: 500,
                      fontSize: "11px",
                      letterSpacing: "0.05em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((bet, idx) => {
                const rs = bet.result_status ? RESULT_STYLE[bet.result_status] : null;
                const clvSign = bet.clv_probability != null ? (bet.clv_probability >= 0 ? "+" : "") : "";
                return (
                  <tr
                    key={bet.id}
                    style={{ borderTop: idx > 0 ? "1px solid #111827" : undefined }}
                  >
                    <td style={{ padding: "10px 14px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      {bet.game_date}
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 500 }}>{bet.player_name}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>{statLabel(bet.stat_category)}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          color: bet.selection_type === "over" ? "#60a5fa" : "#fb923c",
                          background: bet.selection_type === "over" ? "rgba(96,165,250,0.12)" : "rgba(251,146,60,0.12)",
                          borderRadius: "4px",
                          padding: "2px 7px",
                          fontSize: "11px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        {bet.selection_type}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{bet.line}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>--</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", color: "var(--text-secondary)", fontSize: "12px" }}>
                      {bookLabel(bet.sportsbook)}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {bet.odds_american != null ? formatOdds(bet.odds_american) : "--"}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>
                      {bet.wager != null ? `$${bet.wager.toFixed(0)}` : "--"}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      {rs ? (
                        <span
                          style={{
                            color: rs.color,
                            background: rs.bg,
                            borderRadius: "4px",
                            padding: "2px 8px",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          {rs.label}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>open</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                        color:
                          bet.clv_probability == null
                            ? "var(--text-muted)"
                            : bet.clv_probability > 0
                            ? "#34d399"
                            : "#f87171",
                      }}
                    >
                      {bet.clv_probability != null
                        ? `${clvSign}${(bet.clv_probability * 100).toFixed(1)}%`
                        : "--"}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>
                      {bet.result_actual_value != null ? bet.result_actual_value : "--"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={bets.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </div>
  );
}
