"use client";

import { useEffect } from "react";
import { ScanRow, formatOdds, formatEdge, formatEvent, formatEventMeta, statLabel, bookLabel, edgeTier, EdgeTier, primaryEdge, primaryEdgeLabel } from "@/lib/types";
import TierBadge from "./TierBadge";

const TIER_COLOR: Record<EdgeTier, string> = {
  S: "#a78bfa",
  A: "#34d399",
  B: "#60a5fa",
  C: "#fbbf24",
  D: "#fb923c",
  F: "#f87171",
};

interface Props {
  row: ScanRow;
  onClose: () => void;
}

function modelAmerican(prob: number): number {
  if (prob >= 0.5) return Math.round(-100 * prob / (1 - prob));
  return Math.round(100 * (1 - prob) / prob);
}

export default function Drawer({ row, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Model 2.0 Phase 1: primary edge is vs fair/devigged market.
  const edge = primaryEdge(row);
  const tier = edgeTier(edge);
  const tierColor = TIER_COLOR[tier];
  const event = formatEvent(row);
  const eventMeta = formatEventMeta(row);
  const resultLabel =
    row.result_status === "won" ? "W" :
    row.result_status === "lost" ? "L" :
    row.result_status === "push" ? "P" :
    "open";
  const resultColor =
    row.result_status === "won" ? "#34d399" :
    row.result_status === "lost" ? "#f87171" :
    "var(--text-muted)";

  const REASON_LABEL: Record<string, string> = {
    cal_swing_outlier: "calibration swing outlier",
    large_edge_no_pinnacle: "large edge without Pinnacle",
    model_pinnacle_outlier: "model vs pinnacle outlier",
    pinnacle_outlier: "vs pinnacle outlier",
    line_through_model: "line through model",
    soft_book_outlier: "soft-book outlier",
    line_spread: "line spread across books",
    minutes_or_workload: "minutes / workload flag",
    minutes_uncertainty: "minutes uncertainty",
  };
  const reasonList: string[] = Array.isArray(row.needs_review_reasons)
    ? row.needs_review_reasons
    : typeof row.needs_review_reasons === "string" && row.needs_review_reasons
      ? (() => {
          try {
            const p = JSON.parse(row.needs_review_reasons);
            return Array.isArray(p) ? p.map(String) : [];
          } catch {
            return [];
          }
        })()
      : [];
  const flags: string[] = reasonList.map((r) => REASON_LABEL[r] ?? r);
  if (row.workload_flag && !flags.some((f) => f.includes("workload") || f.includes("minutes")))
    flags.push(row.workload_flag);
  if (
    reasonList.length === 0 &&
    row.model_pinnacle_divergence != null &&
    row.model_pinnacle_divergence >= 0.08
  )
    flags.push("model vs pinnacle outlier");
  if (
    reasonList.length === 0 &&
    row.pinnacle_divergence != null &&
    row.pinnacle_divergence >= 0.08
  )
    flags.push("vs pinnacle outlier");
  if (reasonList.length === 0 && row.line_spread != null && row.line_spread > 0)
    flags.push(`line spread ${row.line_spread.toFixed(1)} across books`);

  const rawP = row.raw_model_probability;
  const calP = row.calibrated_model_probability ?? row.model_probability;
  const calSwing =
    rawP != null && calP != null ? Math.abs(calP - rawP) : null;

  const matchup = row.matchup_json ? (() => {
    try { return JSON.parse(row.matchup_json); } catch { return null; }
  })() : null;

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 100,
        }}
      />
      {/* drawer */}
      <div
        className="drawer-panel"
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: "min(520px, 95vw)",
          background: "#111827",
          borderLeft: "1px solid var(--border)",
          zIndex: 101,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
              {row.player_name}
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              {statLabel(row.stat_category)} {row.selection_type} {row.line} &middot; {bookLabel(row.sportsbook)}
              {event !== "--" && <> &middot; {event}</>}
              {eventMeta && <> &middot; {eventMeta}</>}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "20px",
              lineHeight: 1,
              padding: "4px",
              flexShrink: 0,
            }}
          >
            &times;
          </button>
        </div>

        {/* key stats row */}
        <div
          className="drawer-stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
          }}
        >
          {[
            { label: primaryEdgeLabel(row), value: formatEdge(edge), color: tierColor },
            { label: "Tier", value: <TierBadge edge={edge} /> },
            { label: "Raw book edge", value: row.raw_book_edge != null ? formatEdge(row.raw_book_edge) : "--" },
            { label: "Games used", value: row.n_games_used ?? "--" },
            { label: "Book odds", value: row.odds_american != null ? formatOdds(row.odds_american) : "--" },
            { label: "Pinnacle", value: row.fair_value_odds != null && row.fair_value_source === "pinnacle" ? formatOdds(row.fair_value_odds) : "--" },
            { label: "Model odds", value: row.model_probability != null ? formatOdds(modelAmerican(row.model_probability)) : "--", color: "#3b82f6" },
            { label: "Fair prob", value: row.fair_probability != null ? `${(row.fair_probability * 100).toFixed(1)}%` : "--" },
            ...(row.calibrated_model_probability != null || row.raw_model_probability != null
              ? [
                  {
                    label: "Calibrated p",
                    value: row.calibrated_model_probability != null
                      ? `${(row.calibrated_model_probability * 100).toFixed(1)}%`
                      : `${(row.model_probability * 100).toFixed(1)}%`,
                  },
                  {
                    label: "Raw model p",
                    value: row.raw_model_probability != null
                      ? `${(row.raw_model_probability * 100).toFixed(1)}%`
                      : "--",
                  },
                ]
              : []),
            { label: "Result", value: resultLabel, color: resultColor },
            { label: "Actual", value: row.result_actual_value != null ? row.result_actual_value : "--" },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                background: "#0d1220",
                borderRadius: "8px",
                padding: "12px 14px",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "6px" }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: (stat as { color?: string }).color ?? "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* projection breakdown */}
        <div style={{ background: "#0d1220", borderRadius: "8px", padding: "16px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px" }}>
            Projection
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
            {row.projection_mean != null && (
              <Row label="Season avg" value={row.projection_mean.toFixed(2)} />
            )}
            {row.unshrunk_mean != null && row.projection_mean != null && Math.abs(row.unshrunk_mean - row.projection_mean) > 0.01 && (
              <Row label="Shrunk to" value={row.projection_mean.toFixed(2)} detail={`from ${row.unshrunk_mean.toFixed(2)}`} />
            )}
            {row.projection_std != null && (
              <Row label="Std dev" value={row.projection_std.toFixed(2)} />
            )}
            {row.distribution_type && (
              <Row label="Distribution" value={row.distribution_type === "negative_binomial" ? "Negative Binomial" : "Poisson"} />
            )}
            {row.model_probability != null && (
              <Row label="Model probability" value={`${(row.model_probability * 100).toFixed(1)}%`} accent />
            )}
            {rawP != null && calP != null && (
              <Row
                label="Raw → calibrated"
                value={`${(rawP * 100).toFixed(1)}% → ${(calP * 100).toFixed(1)}%`}
                detail={calSwing != null && calSwing >= 0.10 ? "cal swing ≥10pp" : undefined}
              />
            )}
            {calSwing != null && calSwing >= 0.10 && (
              <div style={{ fontSize: "12px", color: "#fbbf24", marginTop: "4px" }}>
                Calibration moved this side-prob by {(calSwing * 100).toFixed(1)}pp — treat with caution.
              </div>
            )}
          </div>
        </div>

        {/* review reason chips */}
        {reasonList.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {reasonList.map((code) => (
              <span
                key={code}
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "#fbbf24",
                  background: "rgba(251,191,36,0.08)",
                  border: "1px solid rgba(251,191,36,0.25)",
                  borderRadius: "4px",
                  padding: "4px 8px",
                }}
              >
                {REASON_LABEL[code] ?? code}
              </span>
            ))}
          </div>
        )}

        {/* matchup */}
        {matchup && (
          <div style={{ background: "#0d1220", borderRadius: "8px", padding: "16px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px" }}>
              Matchup adjustment
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              {matchup.adjustment_factor != null ? (
                <>
                  {matchup.opponent_team} allows{" "}
                  {matchup.opponent_rate != null ? matchup.opponent_rate.toFixed(1) : "--"} per 100 possessions
                  (league avg {matchup.league_rate != null ? matchup.league_rate.toFixed(1) : "--"}).{" "}
                  Factor: <strong style={{ color: "var(--text-primary)" }}>{matchup.adjustment_factor.toFixed(3)}x</strong>
                </>
              ) : matchup.projected_k != null ? (
                <>
                  Pitcher K rate {matchup.pitcher_k_pct != null ? `${(matchup.pitcher_k_pct * 100).toFixed(1)}%` : "--"} vs{" "}
                  opponent {matchup.opponent_team} (team K rate{" "}
                  {matchup.opponent_k_pct != null ? `${(matchup.opponent_k_pct * 100).toFixed(1)}%` : "--"}).{" "}
                  Adjusted projection: <strong style={{ color: "var(--text-primary)" }}>{matchup.projected_k?.toFixed(1)}</strong>
                </>
              ) : (
                JSON.stringify(matchup)
              )}
            </div>
          </div>
        )}

        {/* flags */}
        {flags.length > 0 && (
          <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "8px", padding: "14px 16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#fbbf24", marginBottom: "10px" }}>
              Flags / caveats
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
              {flags.map((f, i) => (
                <li key={i} style={{ fontSize: "13px", color: "var(--text-secondary)", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <span style={{ color: "#fbbf24", flexShrink: 0 }}>!</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}

function Row({ label, value, detail, accent }: { label: string; value: React.ReactNode; detail?: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ color: accent ? "#3b82f6" : "var(--text-primary)", fontWeight: accent ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>
        {value}
        {detail && <span style={{ color: "var(--text-muted)", marginLeft: "6px", fontSize: "11px" }}>{detail}</span>}
      </span>
    </div>
  );
}
