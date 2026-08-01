"use client";

import { focusRing, labelStyle, selectStyle } from "./filterStyles";

export interface FilterSelectOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  value: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
  allLabel?: string;
}

export default function FilterSelect({
  label,
  value,
  options,
  onChange,
  allLabel = "All",
}: Props) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
      <span style={labelStyle}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
