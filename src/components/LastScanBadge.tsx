"use client";

import { useEffect, useRef, useState } from "react";
import { formatScanTime } from "@/lib/formatScanTime";

/** Shows Last scan time; briefly highlights when the timestamp changes after a refresh. */
export default function LastScanBadge({ snapshotTime }: { snapshotTime: string | null }) {
  const prev = useRef<string | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!snapshotTime) return;
    if (prev.current != null && prev.current !== snapshotTime) {
      setFlash(true);
      const id = window.setTimeout(() => setFlash(false), 4000);
      prev.current = snapshotTime;
      return () => window.clearTimeout(id);
    }
    prev.current = snapshotTime;
  }, [snapshotTime]);

  if (!snapshotTime) return null;

  return (
    <span
      style={{
        color: flash ? "var(--won)" : "var(--text-muted)",
        fontWeight: flash ? 600 : 400,
        transition: "color 0.3s ease",
        background: flash ? "var(--won-bg)" : "transparent",
        borderRadius: "4px",
        padding: flash ? "2px 8px" : "0",
      }}
      title="When this slate was last written by the model"
    >
      {flash ? "Updated " : "Last scan: "}
      {formatScanTime(snapshotTime)}
    </span>
  );
}
