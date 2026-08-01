"use client";

import { useState } from "react";
import { ScanRow, formatOdds, formatEdge, formatEvent, formatEventMeta, statLabel, bookLabel, edgeTier, EdgeTier } from "@/lib/types";
import TierBadge from "./TierBadge";
import Drawer from "./Drawer";
import Pagination, { PAGE_SIZE_OPTIONS, PageSize, slicePage } from "./Pagination";

const TIER_COLOR: Record<EdgeTier, string> = {
  S: "#a78bfa",
  A: "#34d399",
  B: "#60a5fa",
  C: "#fbbf24",
  D: "#fb923c",
  F: "#f87171",
};

const RESULT_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  won: { color: "#34d399", bg: "rgba(52,211,153,0.12)", label: "W" },
  lost: { color: "#f87171", bg: "rgba(248,113,113,0.12)", label: "L" },
  push: { color: "#9ca3af", bg: "rgba(156,163,175,0.12)", label: "P" },
};

interface Props {
  rows: ScanRow[];
  gameDate: string;
  placedKeys: Set<string>;
}

function betKey(row: ScanRow, gameDate: string): string {
  return `${row.player_name}|${row.stat_category}|${row.selection_type}|${row.sportsbook}|${row.line}|${gameDate}`;
}

export default function ScanTable({ rows, gameDate, placedKeys: initialPlaced }: Props) {
  const [placed, setPlaced] = useState<Set<string>>(new Set(initialPlaced));
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [drawerRow, setDrawerRow] = useState<ScanRow | null>(null);
  const [pageSize, setPageSize] = useState<PageSize>(10);

  const clean = rows.filter((r) => !r.needs_review);
  const review = rows.filter((r) => r.needs_review);

  async function togglePlaced(row: ScanRow, e: React.MouseEvent) {
    e.stopPropagation();
    const key = betKey(row, gameDate);
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
          game_date: gameDate,
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
            game_date: gameDate,
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

  return (
    <div>
      {rows.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
            fontSize: "12px",
            color: "var(--text-muted)",
          }}
        >
          <span>Rows</span>
          <select
            value={String(pageSize)}
            onChange={(e) => {
              const v = e.target.value;
              setPageSize(v === "all" ? "all" : (Number(v) as PageSize));
            }}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              borderRadius: "6px",
              padding: "4px 8px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {clean.length > 0 && (
        <ScanSection
          key={`clean-${pageSize}`}
          label="Clean"
          accent="#34d399"
          sectionRows={clean}
          pageSize={pageSize}
          gameDate={gameDate}
          placed={placed}
          loadingKeys={loadingKeys}
          onTogglePlaced={togglePlaced}
          onRowClick={setDrawerRow}
        />
      )}
      {review.length > 0 && (
        <ScanSection
          key={`review-${pageSize}`}
          label="Needs Review"
          accent="#fbbf24"
          sectionRows={review}
          pageSize={pageSize}
          gameDate={gameDate}
          placed={placed}
          loadingKeys={loadingKeys}
          onTogglePlaced={togglePlaced}
          onRowClick={setDrawerRow}
        />
      )}

      {drawerRow && (
        <Drawer row={drawerRow} onClose={() => setDrawerRow(null)} />
      )}
    </div>
  );
}

function ScanSection({
  label,
  accent,
  sectionRows,
  pageSize,
  gameDate,
  placed,
  loadingKeys,
  onTogglePlaced,
  onRowClick,
}: {
  label: string;
  accent: string;
  sectionRows: ScanRow[];
  pageSize: PageSize;
  gameDate: string;
  placed: Set<string>;
  loadingKeys: Set<string>;
  onTogglePlaced: (row: ScanRow, e: React.MouseEvent) => void;
  onRowClick: (row: ScanRow) => void;
}) {
  const [page, setPage] = useState(1);
  const visible = slicePage(sectionRows, page, pageSize);

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
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["", "Player", "Stat", "Side", "Line", "Event", "Tier", "Edge", "Book", "Book odds", "Pinnacle", "Model odds", "Result", "Actual", ""].map(
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
              {visible.map((row, idx) => {
                const key = betKey(row, gameDate);
                const isPlaced = placed.has(key);
                const isLoading = loadingKeys.has(key);
                const tier = edgeTier(row.edge);
                const eventMeta = formatEventMeta(row);
                const rs = row.result_status ? RESULT_STYLE[row.result_status] : null;
                const modelAmerican = row.model_probability
                  ? row.model_probability >= 0.5
                    ? Math.round(-100 * row.model_probability / (1 - row.model_probability))
                    : Math.round(100 * (1 - row.model_probability) / row.model_probability)
                  : null;

                return (
                  <tr
                    key={`${row.player_name}-${row.stat_category}-${row.selection_type}-${row.sportsbook}-${row.line}`}
                    onClick={() => onRowClick(row)}
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
                    <td style={{ padding: "10px 8px 10px 14px", textAlign: "center", width: "40px" }}>
                      <button
                        onClick={(e) => onTogglePlaced(row, e)}
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
                    <td style={{ padding: "10px 14px", fontWeight: 500, color: "var(--text-primary)" }}>
                      {row.player_name}
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>
                      {statLabel(row.stat_category)}
                    </td>
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
                    <td style={{ padding: "10px 14px", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                      {row.line}
                    </td>
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
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <TierBadge edge={row.edge} />
                    </td>
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
                    <td style={{ padding: "10px 14px", textAlign: "right", color: "var(--text-secondary)", fontSize: "12px" }}>
                      {bookLabel(row.sportsbook)}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>
                      {row.odds_american != null ? formatOdds(row.odds_american) : "--"}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>
                      {row.fair_value_odds != null && row.fair_value_source === "pinnacle"
                        ? formatOdds(row.fair_value_odds)
                        : "--"}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--accent)" }}>
                      {modelAmerican != null ? formatOdds(modelAmerican) : "--"}
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
                    <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>
                      {row.result_actual_value != null ? row.result_actual_value : "--"}
                    </td>
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
      <Pagination
        page={page}
        pageSize={pageSize}
        total={sectionRows.length}
        onPageChange={setPage}
        onPageSizeChange={() => {}}
        showPageSize={false}
      />
    </div>
  );
}
