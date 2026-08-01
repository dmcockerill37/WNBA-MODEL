"use client";

import type { CSSProperties, ReactNode } from "react";

type MarkerProps = {
  children: ReactNode;
  variant?: "default" | "separator";
  role?: string;
  style?: CSSProperties;
};

export function Marker({ children, variant = "default", role, style }: MarkerProps) {
  if (variant === "separator") {
    return (
      <div
        role={role}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "var(--text-muted)",
          fontSize: "12px",
          ...style,
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        {children}
        <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
      </div>
    );
  }

  return (
    <div
      role={role}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function MarkerIcon({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        width: "22px",
        height: "22px",
        borderRadius: "6px",
        background: "var(--bg-card-hover)",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-secondary)",
        flexShrink: 0,
        fontSize: "12px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function MarkerContent({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        fontSize: "12px",
        color: "var(--text-secondary)",
        lineHeight: 1.3,
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Spinner({ style }: { style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      className="run-spinner"
      style={{
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        border: "2px solid var(--border)",
        borderTopColor: "var(--accent)",
        display: "inline-block",
        ...style,
      }}
    />
  );
}
