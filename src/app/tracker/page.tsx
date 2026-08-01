import { getPlacedBets } from "@/lib/queries";
import { PlacedBet } from "@/lib/types";
import TrackerTable from "@/components/TrackerTable";

export const revalidate = 60;

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
        <TrackerTable bets={bets} />
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
