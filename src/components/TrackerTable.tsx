"use client";

import { useMemo, useState } from "react";
import {
  EdgeTier,
  PlacedBet,
  bookLabel,
  edgeTier,
  formatOdds,
  statLabel,
} from "@/lib/types";
import Pagination, { PageSize, slicePage } from "./Pagination";
import TierBadge from "./TierBadge";
import FilterBar from "./filters/FilterBar";
import FilterChip from "./filters/FilterChip";
import FilterSelect from "./filters/FilterSelect";
import SegmentedControl, { type SegmentOption } from "./filters/SegmentedControl";
import { labelStyle } from "./filters/filterStyles";
import { useDebouncedValue } from "./filters/useDebouncedValue";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const RESULT_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  won: { color: "#34d399", bg: "rgba(52,211,153,0.12)", label: "W" },
  lost: { color: "#f87171", bg: "rgba(248,113,113,0.12)", label: "L" },
  push: { color: "#9ca3af", bg: "rgba(156,163,175,0.12)", label: "P" },
};

const TIER_ORDER: EdgeTier[] = ["S", "A", "B", "C", "D", "F"];

const TIER_CHIP: Record<EdgeTier, { color: string; bg: string }> = {
  S: { color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
  A: { color: "#34d399", bg: "rgba(52,211,153,0.15)" },
  B: { color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
  C: { color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
  D: { color: "#fb923c", bg: "rgba(251,146,60,0.15)" },
  F: { color: "#f87171", bg: "rgba(248,113,113,0.15)" },
};

type ResultFilter = "all" | "open" | "won" | "lost" | "push";

const RESULT_OPTIONS: SegmentOption<ResultFilter>[] = [
  { value: "all", label: "All", color: "var(--text-primary)", bg: "rgba(156,163,175,0.14)" },
  { value: "open", label: "Open", color: "var(--text-secondary)", bg: "rgba(156,163,175,0.14)" },
  { value: "won", label: "Won", color: "#34d399", bg: "rgba(52,211,153,0.14)" },
  { value: "lost", label: "Lost", color: "#f87171", bg: "rgba(248,113,113,0.14)" },
  { value: "push", label: "Push", color: "#9ca3af", bg: "rgba(156,163,175,0.14)" },
];

function betTier(bet: PlacedBet): EdgeTier | null {
  if (bet.edge_at_flag == null || Number.isNaN(bet.edge_at_flag)) return null;
  return edgeTier(bet.edge_at_flag);
}

export default function TrackerTable({ bets }: { bets: PlacedBet[] }) {
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ResultFilter>("all");
  const [tiers, setTiers] = useState<EdgeTier[]>([]);
  const [book, setBook] = useState("");
  const [stat, setStat] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 150);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const bookOptions = useMemo(() => {
    const books = Array.from(new Set(bets.map((b) => b.sportsbook))).sort();
    return books.map((b) => ({ value: b, label: bookLabel(b) }));
  }, [bets]);

  const statOptions = useMemo(() => {
    const stats = Array.from(new Set(bets.map((b) => b.stat_category))).sort();
    return stats.map((s) => ({ value: s, label: statLabel(s) }));
  }, [bets]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return bets.filter((bet) => {
      if (result === "open" && bet.result_status != null) return false;
      if (result === "won" && bet.result_status !== "won") return false;
      if (result === "lost" && bet.result_status !== "lost") return false;
      if (result === "push" && bet.result_status !== "push") return false;

      if (tiers.length > 0) {
        const t = betTier(bet);
        if (t == null || !tiers.includes(t)) return false;
      }

      if (book && bet.sportsbook !== book) return false;
      if (stat && bet.stat_category !== stat) return false;
      if (q && !bet.player_name.toLowerCase().includes(q)) return false;

      return true;
    });
  }, [bets, result, tiers, book, stat, debouncedSearch]);

  const hasActiveFilters =
    result !== "all" || tiers.length > 0 || book !== "" || stat !== "" || search.trim() !== "";

  const visible = slicePage(filtered, page, pageSize);

  function resetPage() {
    setPage(1);
  }

  function changeResult(next: ResultFilter) {
    setResult(next);
    resetPage();
  }

  function toggleTier(tier: EdgeTier) {
    setTiers((prev) => (prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]));
    resetPage();
  }

  function changeBook(next: string) {
    setBook(next);
    resetPage();
  }

  function changeStat(next: string) {
    setStat(next);
    resetPage();
  }

  function changeSearch(next: string) {
    setSearch(next);
    resetPage();
  }

  function changePageSize(size: PageSize) {
    setPageSize(size);
    resetPage();
  }

  function clearFilters() {
    setResult("all");
    setTiers([]);
    setBook("");
    setStat("");
    setSearch("");
    resetPage();
  }

  return (
    <div>
      <FilterBar
        search={search}
        onSearchChange={changeSearch}
        matched={filtered.length}
        total={bets.length}
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
        pageSize={pageSize}
        onPageSizeChange={changePageSize}
        primary={
          <SegmentedControl
            aria-label="Result"
            options={RESULT_OPTIONS}
            value={result}
            onChange={changeResult}
          />
        }
        secondary={
          <>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={labelStyle}>Tier</span>
              {TIER_ORDER.map((tier) => (
                <FilterChip
                  key={tier}
                  label={tier}
                  active={tiers.includes(tier)}
                  onToggle={() => toggleTier(tier)}
                  color={TIER_CHIP[tier].color}
                  bg={TIER_CHIP[tier].bg}
                  aria-label={`Tier ${tier}`}
                />
              ))}
            </div>
            <FilterSelect label="Book" value={book} options={bookOptions} onChange={changeBook} />
            <FilterSelect label="Stat" value={stat} options={statOptions} onChange={changeStat} />
          </>
        }
      />

      {filtered.length === 0 ? (
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px" }}>
            No bets match
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                borderRadius: "6px",
                padding: "7px 14px",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : isMobile ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {visible.map((bet) => {
              const rs = bet.result_status ? RESULT_STYLE[bet.result_status] : null;
              const clvSign = bet.clv_probability != null ? (bet.clv_probability >= 0 ? "+" : "") : "";
              const clvColor =
                bet.clv_probability == null
                  ? "var(--text-muted)"
                  : bet.clv_probability > 0
                  ? "#34d399"
                  : "#f87171";

              return (
                <div
                  key={bet.id}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "7px",
                  }}
                >
                  {/* player + date */}
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px" }}>
                      {bet.player_name}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: "12px", whiteSpace: "nowrap" }}>
                      {bet.game_date}
                    </span>
                  </div>

                  {/* stat + side + line + tier */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>{statLabel(bet.stat_category)}</span>
                    <span
                      style={{
                        color: bet.selection_type === "over" ? "#60a5fa" : "#fb923c",
                        background: bet.selection_type === "over" ? "rgba(96,165,250,0.12)" : "rgba(251,146,60,0.12)",
                        borderRadius: "4px",
                        padding: "1px 6px",
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      {bet.selection_type}
                    </span>
                    <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{bet.line}</span>
                    {bet.edge_at_flag != null && <TierBadge edge={bet.edge_at_flag} />}
                  </div>

                  {/* book + odds + wager */}
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    {bookLabel(bet.sportsbook)}{" "}
                    <span style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                      {bet.odds_american != null ? formatOdds(bet.odds_american) : "--"}
                    </span>
                    {bet.wager != null && (
                      <span style={{ color: "var(--text-muted)", marginLeft: "8px" }}>
                        ${bet.wager.toFixed(0)}
                      </span>
                    )}
                  </div>

                  {/* result + CLV */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
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
                    </div>
                    <span style={{ color: clvColor, fontVariantNumeric: "tabular-nums", fontSize: "13px" }}>
                      {bet.clv_probability != null
                        ? `CLV ${clvSign}${(bet.clv_probability * 100).toFixed(1)}%`
                        : "--"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={changePageSize}
            showPageSize={false}
          />
        </>
      ) : (
        <>
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
                    {["Date", "Player", "Stat", "Side", "Line", "Tier", "Book", "Odds", "Wager", "Result", "CLV", "Actual"].map(
                      (h, i) => (
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
                      )
                    )}
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
                        <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>
                          {statLabel(bet.stat_category)}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span
                            style={{
                              color: bet.selection_type === "over" ? "#60a5fa" : "#fb923c",
                              background:
                                bet.selection_type === "over"
                                  ? "rgba(96,165,250,0.12)"
                                  : "rgba(251,146,60,0.12)",
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
                        <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {bet.line}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right" }}>
                          {bet.edge_at_flag != null ? (
                            <TierBadge edge={bet.edge_at_flag} />
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>--</span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "10px 14px",
                            textAlign: "right",
                            color: "var(--text-secondary)",
                            fontSize: "12px",
                          }}
                        >
                          {bookLabel(bet.sportsbook)}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {bet.odds_american != null ? formatOdds(bet.odds_american) : "--"}
                        </td>
                        <td
                          style={{
                            padding: "10px 14px",
                            textAlign: "right",
                            fontVariantNumeric: "tabular-nums",
                            color: "var(--text-secondary)",
                          }}
                        >
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
                        <td
                          style={{
                            padding: "10px 14px",
                            textAlign: "right",
                            fontVariantNumeric: "tabular-nums",
                            color: "var(--text-secondary)",
                          }}
                        >
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
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={changePageSize}
            showPageSize={false}
          />
        </>
      )}
    </div>
  );
}
