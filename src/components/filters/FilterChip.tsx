"use client";

import { TRANSITION } from "./filterStyles";

interface Props {
  label: string;
  active: boolean;
  onToggle: () => void;
  color?: string;
  bg?: string;
  "aria-label"?: string;
}

export default function FilterChip({
  label,
  active,
  onToggle,
  color = "var(--text-secondary)",
  bg = "rgba(156,163,175,0.12)",
  "aria-label": ariaLabel,
}: Props) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={ariaLabel ?? label}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      style={{
        color: active ? color : "var(--text-muted)",
        background: active ? bg : "transparent",
        border: `1px solid ${active ? color : "var(--border)"}`,
        borderRadius: "6px",
        padding: "4px 9px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        cursor: "pointer",
        height: "28px",
        minWidth: "28px",
        transition: TRANSITION,
        opacity: active ? 1 : 0.85,
        transform: "scale(1)",
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)";
        (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLButtonElement).style.opacity = active ? "1" : "0.85";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLButtonElement).style.opacity = active ? "1" : "0.85";
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 2px rgba(59, 130, 246, 0.35)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {label}
    </button>
  );
}
