import { getHistoryRows } from "@/lib/queries";
import {
  formatOdds,
  formatEdge,
  formatEvent,
  formatEventMeta,
  rowGameDate,
  statLabel,
  bookLabel,
} from "@/lib/types";
import TierBadge from "@/components/TierBadge";

export const revalidate = 300;

const RESULT_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  won: { color: "#34d399", bg: "rgba(52,211,153,0.12)", label: "W" },
  lost: { color: "#f87171", bg: "rgba(248,113,113,0.12)", label: "L" },
  push: { color: "#9ca3af", bg: "rgba(156,163,175,0.12)", label: "P" },
};

export default async function HistoryPage() {
  const rows = await getHistoryRows(300);

  const byDate = rows.reduce<Record<string, typeof rows>>((acc, row) => {
    const d = rowGameDate(row) ?? "unknown";
    if (!acc[d]) acc[d] = [];
    acc[d].push(row);
    return acc;
  }, {});

  // Newest dates first; keep unknown last
  const dateKeys = Object.keys(byDate).sort((a, b) => {
    if (a === "unknown") return 1;
    if (b === "unknown") return -1;
    return b.localeCompare(a);
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>
          History
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          Clean model picks with win/loss and the actual prop result when settled.
        </p>
      </div>

      {dateKeys.length === 0 ? (
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            padding: "48px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          No scan history yet.
        </div>
      ) : (
        dateKeys.map((date) => {
          const dateRows = byDate[date];
          return (
          <div key={date} style={{ marginBottom: "32px" }}>
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
              {date} &mdash; {dateRows.length} picks
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
                    {dateRows.map((row, idx) => {
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
          </div>
          );
        })
      )}
    </div>
  );
}
