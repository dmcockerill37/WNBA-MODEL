"use client";

import type { ReactNode } from "react";
import { clearButtonStyle, focusRing, labelStyle, selectStyle } from "./filterStyles";
import SearchInput from "./SearchInput";
import { PAGE_SIZE_OPTIONS, type PageSize } from "../Pagination";

interface Props {
  /** Top-left controls (e.g. result segmented control). */
  primary: ReactNode;
  /** Second-row controls (tier chips, book/stat selects). */
  secondary: ReactNode;
  search: string;
  onSearchChange: (value: string) => void;
  matched: number;
  total: number;
  unit?: string;
  hasActiveFilters: boolean;
  onClear: () => void;
  pageSize: PageSize;
  onPageSizeChange: (size: PageSize) => void;
}

export default function FilterBar({
  primary,
  secondary,
  search,
  onSearchChange,
  matched,
  total,
  unit = "bets",
  hasActiveFilters,
  onClear,
  pageSize,
  onPageSizeChange,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        marginBottom: "14px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "12px",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "12px",
            minWidth: 0,
          }}
        >
          {primary}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "10px",
            flex: "1 1 220px",
            justifyContent: "flex-end",
            minWidth: "min(100%, 180px)",
          }}
        >
          <SearchInput value={search} onChange={onSearchChange} />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "12px",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "12px",
            minWidth: 0,
          }}
        >
          {secondary}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClear}
              style={clearButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.background = "var(--bg-card-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.background = "transparent";
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = focusRing;
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "12px",
            marginLeft: "auto",
            fontSize: "12px",
            color: "var(--text-muted)",
          }}
        >
          <label style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <span style={labelStyle}>Rows</span>
            <select
              value={String(pageSize)}
              onChange={(e) => {
                const v = e.target.value;
                onPageSizeChange(v === "all" ? "all" : (Number(v) as PageSize));
              }}
              style={selectStyle}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = focusRing;
                e.currentTarget.style.borderColor = "var(--accent)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
            {matched === total ? `${total} ${unit}` : `${matched} of ${total} ${unit}`}
          </span>
        </div>
      </div>
    </div>
  );
}
