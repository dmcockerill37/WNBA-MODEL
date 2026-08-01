"use client";

import type { CSSProperties } from "react";

export type PageSize = 10 | 15 | 25 | "all";

export const PAGE_SIZE_OPTIONS: { value: PageSize; label: string }[] = [
  { value: 10, label: "10" },
  { value: 15, label: "15" },
  { value: 25, label: "25" },
  { value: "all", label: "All" },
];

export function slicePage<T>(items: T[], page: number, pageSize: PageSize): T[] {
  if (pageSize === "all") return items;
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function totalPages(total: number, pageSize: PageSize): number {
  if (pageSize === "all" || total === 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

interface Props {
  page: number;
  pageSize: PageSize;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
  /** When false, hide the Rows selector (still shows range + Prev/Next). */
  showPageSize?: boolean;
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  showPageSize = true,
}: Props) {
  if (total === 0) return null;

  const pages = totalPages(total, pageSize);
  const sizeNum = pageSize === "all" ? total : pageSize;
  const from = pageSize === "all" ? 1 : (page - 1) * sizeNum + 1;
  const to = pageSize === "all" ? total : Math.min(page * sizeNum, total);

  const btnStyle = (disabled: boolean): CSSProperties => ({
    background: "transparent",
    border: "1px solid var(--border)",
    color: disabled ? "var(--text-muted)" : "var(--text-secondary)",
    borderRadius: "6px",
    padding: "5px 10px",
    fontSize: "12px",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
        padding: "10px 4px 0",
        fontSize: "12px",
        color: "var(--text-muted)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {showPageSize && (
          <>
            <span>Rows</span>
            <select
              value={String(pageSize)}
              onChange={(e) => {
                const v = e.target.value;
                onPageSizeChange(v === "all" ? "all" : (Number(v) as PageSize));
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
          </>
        )}
        <span>
          {from}–{to} of {total}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          style={btnStyle(page <= 1)}
        >
          Prev
        </button>
        <span style={{ color: "var(--text-secondary)", minWidth: "64px", textAlign: "center" }}>
          {page} / {pages}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          style={btnStyle(page >= pages)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
