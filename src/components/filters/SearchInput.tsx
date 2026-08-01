"use client";

import { focusRing, TRANSITION } from "./filterStyles";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search player…",
  "aria-label": ariaLabel = "Search player",
}: Props) {
  return (
    <div
      className="filter-search"
      style={{
        position: "relative",
        flex: "1 1 180px",
        minWidth: "min(100%, 160px)",
        maxWidth: "320px",
        width: "100%",
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        style={{
          position: "absolute",
          left: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-muted)",
          pointerEvents: "none",
        }}
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        style={{
          width: "100%",
          height: "32px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          color: "var(--text-primary)",
          fontSize: "12px",
          padding: value ? "6px 30px 6px 30px" : "6px 12px 6px 30px",
          outline: "none",
          transition: TRANSITION,
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = focusRing;
          e.currentTarget.style.borderColor = "var(--accent)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      />
      {value.length > 0 && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: "6px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "2px 6px",
            fontSize: "14px",
            lineHeight: 1,
            borderRadius: "4px",
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = focusRing;
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
