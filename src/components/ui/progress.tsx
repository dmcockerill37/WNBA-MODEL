"use client";

import type { CSSProperties } from "react";

type ProgressProps = {
  value?: number;
  className?: string;
  style?: CSSProperties;
};

/** Simple determinate progress bar (0–100). */
export function Progress({ value = 0, className, style }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={className}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        height: "6px",
        width: "100%",
        borderRadius: "999px",
        background: "var(--border)",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${clamped}%`,
          borderRadius: "999px",
          background: "var(--accent)",
          transition: "width 400ms ease",
        }}
      />
    </div>
  );
}
