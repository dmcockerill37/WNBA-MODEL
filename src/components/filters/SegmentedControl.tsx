"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { TRANSITION } from "./filterStyles";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** Active text/border tint */
  color?: string;
  /** Active background fill */
  bg?: string;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label"?: string;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel = "Filter",
}: Props<T>) {
  const groupId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function focusIndex(index: number) {
    const el = refs.current[index];
    el?.focus();
  }

  function handleKeyDown(e: KeyboardEvent, index: number) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = (index + 1) % options.length;
      onChange(options[next].value);
      focusIndex(next);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (index - 1 + options.length) % options.length;
      onChange(options[prev].value);
      focusIndex(prev);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(options[0].value);
      focusIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      const last = options.length - 1;
      onChange(options[last].value);
      focusIndex(last);
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        overflow: "hidden",
        background: "var(--bg-card)",
      }}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        const color = opt.color ?? "var(--text-primary)";
        const bg = opt.bg ?? "rgba(59, 130, 246, 0.14)";
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            id={`${groupId}-${opt.value}`}
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            style={{
              appearance: "none",
              border: "none",
              borderRight: i < options.length - 1 ? "1px solid var(--border)" : "none",
              background: active ? bg : "transparent",
              color: active ? color : "var(--text-muted)",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: active ? 600 : 500,
              cursor: "pointer",
              height: "32px",
              transition: TRANSITION,
              whiteSpace: "nowrap",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "inset 0 0 0 2px rgba(59, 130, 246, 0.35)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
