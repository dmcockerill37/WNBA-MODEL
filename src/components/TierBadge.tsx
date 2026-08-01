import { edgeTier, EdgeTier } from "@/lib/types";

const TIER_STYLES: Record<EdgeTier, { color: string; bg: string }> = {
  S: { color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
  A: { color: "#34d399", bg: "rgba(52,211,153,0.15)" },
  B: { color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
  C: { color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
  D: { color: "#fb923c", bg: "rgba(251,146,60,0.15)" },
  F: { color: "#f87171", bg: "rgba(248,113,113,0.15)" },
};

export default function TierBadge({ edge }: { edge: number }) {
  const tier = edgeTier(edge);
  const { color, bg } = TIER_STYLES[tier];
  return (
    <span
      style={{
        color,
        background: bg,
        borderRadius: "4px",
        padding: "2px 8px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        fontVariantNumeric: "tabular-nums",
        display: "inline-block",
      }}
    >
      {tier}
    </span>
  );
}
