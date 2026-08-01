import type { CSSProperties } from "react";

export const TRANSITION =
  "background-color 140ms ease, border-color 140ms ease, color 140ms ease, opacity 140ms ease, transform 120ms ease, box-shadow 140ms ease";

export const selectStyle: CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  color: "var(--text-secondary)",
  borderRadius: "6px",
  padding: "6px 10px",
  fontSize: "12px",
  cursor: "pointer",
  height: "32px",
  outline: "none",
  transition: TRANSITION,
};

export const labelStyle: CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  whiteSpace: "nowrap",
};

export const clearButtonStyle: CSSProperties = {
  background: "transparent",
  border: "1px solid transparent",
  color: "var(--text-secondary)",
  borderRadius: "6px",
  padding: "6px 10px",
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
  height: "32px",
  transition: TRANSITION,
};

export const focusRing = "0 0 0 2px rgba(59, 130, 246, 0.35)";
