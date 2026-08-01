import { getPlacedBets } from "@/lib/queries";
import { PlacedBet, ResultStatus, formatOdds, statLabel, bookLabel, edgeTier } from "@/lib/types";
import TierBadge from "@/components/TierBadge";

export const revalidate = 60;

const RESULT_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  won: { color: "#34d399", bg: "rgba(52,211,153,0.12)", label: "W" },
  lost: { color: "#f87171", bg: "rgba(248,113,113,0.12)", label: "L" },
  push: { color: "#9ca3af", bg: "rgba(156,163,175,0.12)", label: "P" },
};

function computeKPIs(bets: PlacedBet[]) {
  const closed = bets.filter((b) => b.result_status != null);
  const won = closed.filter((b) => b.result_status === "won").length;
  const lost = closed.filter((b) => b.result_status === "lost").length;
  const push = closed.filter((b) => b.result_status === "push").length;
  const open = bets.filter((b) => b.result_status == null).length;

  const totalWagered = bets.reduce((sum, b) => sum + (b.wager ?? 0), 0);
  const netProfit = closed.reduce((sum, b) => {
    if (!b.wager || !b.result_status) return sum;
    if (b.result_status === "won") {
      const odds = b.odds_american ?? -110;
      const payout = odds > 0 ? (odds / 100) * b.wager : (100 / Math.abs(odds)) * b.wager;
      return sum + payout;
    }
    if (b.result_status === "lost") return sum - b.wager;
    return sum;
  }, 0);
  const roi = totalWagered > 0 ? netProfit / totalWagered : 0;

  return { won, lost, push, open, totalWagered, netProfit, roi, closedCount: closed.length };
}

export default async function TrackerPage() {
  const bets = await getPlacedBets();
  const kpi = computeKPIs(bets);

  const hasWager = bets.some((b) => b.wager != null && b.wager > 0);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "24px" }}>
        Bet Tracker
      </h1>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "32px" }}>
        <KPICard label="Record" value={`${kpi.won}-${kpi.lost}-${kpi.push}`} sub={`${kpi.open} open`} />
        <KPICard label="Win Rate" value={kpi.closedCount > 0 ? `${((kpi.won / (kpi.closedCount - kpi.push)) * 100).toFixed(1)}%` : "--"} />
        {hasWager && (
          <>
            <KPICard label="Wagered" value={`$${kpi.totalWagered.toFixed(0)}`} />
            <KPICard
              label="Net Profit"
              value={`${kpi.netProfit >= 0 ? "+" : ""}$${kpi.netProfit.toFixed(0)}`}
              color={kpi.netProfit > 0 ? "#34d399" : kpi.netProfit < 0 ? "#f87171" : undefined}
            />
            <KPICard
              label="ROI"
              value={`${kpi.roi >= 0 ? "+" : ""}${(kpi.roi * 100).toFixed(1)}%`}
              color={kpi.roi > 0 ? "#34d399" : kpi.roi < 0 ? "#f87171" : undefined}
            />
          </>
        )}
        <KPICard label="Total bets" value={String(bets.length)} />
      </div>

      {bets.length === 0 ? (
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
          No bets tracked yet. Check the box next to a bet on Today, Tomorrow, or Yesterday to add it here.
        </div>
      ) : (
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
                {bets.map((bet, idx) => {
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
      )}
    </div>
  );
}

function KPICard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: "10px",
        border: "1px solid var(--border)",
        padding: "16px 18px",
      }}
    >
      <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "8px" }}>
        {label}
      </div>
      <div style={{ fontSize: "22px", fontWeight: 700, color: color ?? "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{sub}</div>}
    </div>
  );
}
