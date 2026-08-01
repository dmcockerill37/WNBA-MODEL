"use client";

import { useState } from "react";
import {
  HistoryRow,
  formatOdds,
  formatEdge,
  formatEvent,
  formatEventMeta,
  statLabel,
  bookLabel,
} from "@/lib/types";
import TierBadge from "./TierBadge";
import Pagination, { PAGE_SIZE_OPTIONS, PageSize, slicePage } from "./Pagination";

const RESULT_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  won: { color: "#34d399", bg: "rgba(52,211,153,0.12)", label: "W" },
  lost: { color: "#f87171", bg: "rgba(248,113,113,0.12)", label: "L" },
  push: { color: "#9ca3af", bg: "rgba(156,163,175,0.12)", label: "P" },
};

interface Props {
  groups: { date: string; rows: HistoryRow[] }[];
}

export default function HistoryList({ groups }: Props) {
  const [pageSize, setPageSize] = useState<PageSize>(10);

  return (
    <div>
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
      {groups.map((group) => (
        <HistoryDateSection
          key={`${group.date}-${pageSize}`}
          date={group.date}
          rows={group.rows}
          pageSize={pageSize}
        />
      ))}
    </div>
  );
}

function HistoryDateSection({
  date,
  rows,
  pageSize,
}: {
  date: string;
  rows: HistoryRow[];
  pageSize: PageSize;
}) {
  const [page, setPage] = useState(1);
  const visible = slicePage(rows, page, pageSize);

  return (
    <div style={{ marginBottom: "32px" }}>
      <div
        style={{
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.06em",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          marginBottom: "8px",
          padding: "0 4px",
        }}
      >
        {date} &mdash; {rows.length} picks
      </div>
      <div style={{ background: "var(--bg-card)", borderRadius: "10px", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Player", "Stat", "Side", "Line", "Event", "Tier", "Edge", "Book", "Odds", "Model odds", "Result", "Actual"].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: "9px 14px",
                      textAlign: i >= 5 ? "right" : "left",
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
              {visible.map((row, idx) => {
                const eventMeta = formatEventMeta(row);
                const rs = row.result_status ? RESULT_STYLE[row.result_status] : null;
                const modelAmerican =
                  row.model_probability != null
                    ? row.model_probability >= 0.5
                      ? Math.round((-100 * row.model_probability) / (1 - row.model_probability))
                      : Math.round((100 * (1 - row.model_probability)) / row.model_probability)
                    : null;
                return (
                  <tr key={row.id} style={{ borderTop: idx > 0 ? "1px solid #111827" : undefined }}>
                    <td style={{ padding: "9px 14px", fontWeight: 500 }}>{row.player_name}</td>
                    <td style={{ padding: "9px 14px", color: "var(--text-secondary)" }}>{statLabel(row.stat_category)}</td>
                    <td style={{ padding: "9px 14px" }}>
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
                    <td style={{ padding: "9px 14px", fontVariantNumeric: "tabular-nums" }}>{row.line}</td>
                    <td style={{ padding: "9px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                        {formatEvent(row)}
                      </div>
                      {eventMeta && (
                        <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "2px" }}>
                          {eventMeta}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "9px 14px", textAlign: "right" }}>
                      <TierBadge edge={row.edge} />
                    </td>
                    <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                      {formatEdge(row.edge)}
                    </td>
                    <td style={{ padding: "9px 14px", textAlign: "right", color: "var(--text-secondary)", fontSize: "12px" }}>
                      {bookLabel(row.sportsbook)}
                    </td>
                    <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {row.odds_american != null ? formatOdds(row.odds_american) : "--"}
                    </td>
                    <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#3b82f6" }}>
                      {modelAmerican != null ? formatOdds(modelAmerican) : "--"}
                    </td>
                    <td style={{ padding: "9px 14px", textAlign: "right" }}>
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
                    <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>
                      {row.result_actual_value != null ? row.result_actual_value : "--"}
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
        total={rows.length}
        onPageChange={setPage}
        onPageSizeChange={() => {}}
        showPageSize={false}
      />
    </div>
  );
}
