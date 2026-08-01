import { getPlacedBets } from "@/lib/queries";
import {
  EDGE_BUCKETS,
  EdgeTier,
  PlacedBet,
  TierClvStats,
  edgeBucketKey,
  edgeTier,
  emptyTierClvStats,
} from "@/lib/types";
import TrackerTable from "@/components/TrackerTable";

// Placed bets change whenever the user tracks from Today/Tomorrow/Yesterday —
// always render from the live DB, never a stale ISR snapshot.
export const dynamic = "force-dynamic";

const TIER_ORDER: EdgeTier[] = ["S", "A", "B", "C", "D", "F"];

function accumulate(stats: TierClvStats, bet: PlacedBet) {
  stats.total += 1;
  if (bet.result_status === "won") stats.won += 1;
  else if (bet.result_status === "lost") stats.lost += 1;
  else if (bet.result_status === "push") stats.push += 1;
  else stats.open += 1;
}

function finalize(stats: TierClvStats, clvs: number[]) {
  const decided = stats.won + stats.lost;
  stats.hit_rate = decided > 0 ? stats.won / decided : null;
  stats.n_with_clv = clvs.length;
  stats.mean_clv = clvs.length > 0 ? clvs.reduce((a, b) => a + b, 0) / clvs.length : null;
}

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

  const by_tier = Object.fromEntries(TIER_ORDER.map((t) => [t, emptyTierClvStats()])) as Record<
    EdgeTier,
    TierClvStats
  >;
  const tierClvs: Record<EdgeTier, number[]> = {
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
    F: [],
  };

  const by_edge_bucket = Object.fromEntries(
    EDGE_BUCKETS.map((b) => [b.key, emptyTierClvStats()])
  ) as Record<string, TierClvStats>;
  const bucketClvs: Record<string, number[]> = Object.fromEntries(
    EDGE_BUCKETS.map((b) => [b.key, [] as number[]])
  );

  for (const bet of bets) {
    const edge = bet.edge_at_flag;
    const tier = edge != null ? edgeTier(edge) : "F";
    accumulate(by_tier[tier], bet);
    if (bet.clv_probability != null) tierClvs[tier].push(bet.clv_probability);

    const bucket = edgeBucketKey(edge);
    accumulate(by_edge_bucket[bucket], bet);
    if (bet.clv_probability != null) bucketClvs[bucket].push(bet.clv_probability);
  }

  for (const t of TIER_ORDER) finalize(by_tier[t], tierClvs[t]);
  for (const b of EDGE_BUCKETS) finalize(by_edge_bucket[b.key], bucketClvs[b.key]);

  return {
    won,
    lost,
    push,
    open,
    totalWagered,
    netProfit,
    roi,
    closedCount: closed.length,
    by_tier,
    by_edge_bucket,
  };
}

function formatHitRate(s: TierClvStats): string {
  if (s.hit_rate == null) return "--";
  return `${(s.hit_rate * 100).toFixed(0)}%`;
}

function formatClv(s: TierClvStats): string {
  if (s.mean_clv == null) return "--";
  const sign = s.mean_clv >= 0 ? "+" : "";
  return `${sign}${(s.mean_clv * 100).toFixed(1)}%`;
}

export default async function TrackerPage() {
  const bets = await getPlacedBets();
  const kpi = computeKPIs(bets);

  const hasWager = bets.some((b) => b.wager != null && b.wager > 0);
  const tierRows = TIER_ORDER.filter((t) => kpi.by_tier[t].total > 0);
  const bucketRows = EDGE_BUCKETS.filter((b) => kpi.by_edge_bucket[b.key].total > 0);

  return (
    <div className="page-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}>
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

      {tierRows.length > 0 && (
        <SliceTable
          title="By tier"
          subtitle="Hit rate and mean CLV for placed bets joined to bet_journal (edge_at_flag → edgeTier)"
          headers={["Tier", "N", "W-L-P", "Hit", "Mean CLV"]}
          rows={tierRows.map((t) => {
            const s = kpi.by_tier[t];
            return [
              t,
              String(s.total),
              `${s.won}-${s.lost}-${s.push}`,
              formatHitRate(s),
              formatClv(s),
            ];
          })}
          clvColIndex={4}
        />
      )}

      {bucketRows.length > 0 && (
        <SliceTable
          title="By edge vs fair"
          subtitle="Same journal join, bucketed by edge_at_flag bands"
          headers={["Edge", "N", "W-L-P", "Hit", "Mean CLV"]}
          rows={bucketRows.map((b) => {
            const s = kpi.by_edge_bucket[b.key];
            return [
              b.label,
              String(s.total),
              `${s.won}-${s.lost}-${s.push}`,
              formatHitRate(s),
              formatClv(s),
            ];
          })}
          clvColIndex={4}
        />
      )}

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

function SliceTable({
  title,
  subtitle,
  headers,
  rows,
  clvColIndex,
}: {
  title: string;
  subtitle: string;
  headers: string[];
  rows: string[][];
  clvColIndex: number;
}) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <div style={{ marginBottom: "10px" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{title}</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{subtitle}</div>
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
              {headers.map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 14px",
                    textAlign: i === 0 ? "left" : "right",
                    color: "var(--text-muted)",
                    fontWeight: 500,
                    fontSize: "11px",
                    letterSpacing: "0.05em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} style={{ borderTop: idx > 0 ? "1px solid #111827" : undefined }}>
                {row.map((cell, i) => {
                  const isClv = i === clvColIndex;
                  const clvColor =
                    !isClv || cell === "--"
                      ? undefined
                      : cell.startsWith("+")
                        ? "#34d399"
                        : cell.startsWith("-")
                          ? "#f87171"
                          : undefined;
                  return (
                    <td
                      key={i}
                      style={{
                        padding: "10px 14px",
                        textAlign: i === 0 ? "left" : "right",
                        fontWeight: i === 0 ? 600 : 400,
                        fontVariantNumeric: "tabular-nums",
                        color: clvColor ?? (i === 0 ? "var(--text-primary)" : "var(--text-secondary)"),
                      }}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
