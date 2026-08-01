"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getRunActionStatus, startRunAction } from "@/app/actions/run-model";
import type { RunAction } from "@/lib/run-actions";

type JobState =
  | { kind: "idle" }
  | { kind: "starting"; action: RunAction }
  | { kind: "running"; action: RunAction; runId: number | null }
  | { kind: "success"; action: RunAction }
  | { kind: "error"; action: RunAction; message: string };

const ACTIONS: { action: RunAction; label: string; hint: string }[] = [
  {
    action: "scan",
    label: "Run scan",
    hint: "Full model scan for this date (~1–3 min)",
  },
  {
    action: "resolve",
    label: "Resolve results",
    hint: "Closing lines + won/lost/push",
  },
  {
    action: "pinnacle-check",
    label: "Pinnacle odds check",
    hint: "Fill Pinnacle fair on rows that missed it",
  },
];

const ACTION_LABEL: Record<RunAction, string> = {
  scan: "Scan",
  resolve: "Resolve",
  "pinnacle-check": "Pinnacle check",
};

function dateFromPath(pathname: string): string {
  if (pathname === "/today" || pathname.startsWith("/today/")) return "today";
  if (pathname === "/tomorrow" || pathname.startsWith("/tomorrow/")) return "tomorrow";
  if (pathname === "/yesterday" || pathname.startsWith("/yesterday/")) return "yesterday";
  return "today";
}

const btnBase: CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  color: "var(--text-secondary)",
  fontSize: "13px",
  fontWeight: 500,
  padding: "6px 12px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
};

export default function ActionsMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [job, setJob] = useState<JobState>({ kind: "idle" });
  const rootRef = useRef<HTMLDivElement>(null);
  const busy = job.kind === "starting" || job.kind === "running";

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (job.kind !== "success" && job.kind !== "error") return;
    const id = window.setTimeout(() => setJob({ kind: "idle" }), 8000);
    return () => window.clearTimeout(id);
  }, [job.kind]);

  useEffect(() => {
    if (job.kind !== "running" || job.runId == null) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const { run } = await getRunActionStatus(job.runId!);
        if (cancelled) return;
        if (run.status === "completed") {
          if (run.conclusion === "success") {
            setJob({ kind: "success", action: job.action });
            router.refresh();
          } else {
            setJob({
              kind: "error",
              action: job.action,
              message: "GitHub Action failed — check bet-model Actions logs",
            });
          }
          return;
        }
        window.setTimeout(tick, 4000);
      } catch (err) {
        if (cancelled) return;
        setJob({
          kind: "error",
          action: job.action,
          message: err instanceof Error ? err.message : "Poll failed",
        });
      }
    };
    const id = window.setTimeout(tick, 3000);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [job, router]);

  async function start(action: RunAction) {
    setOpen(false);
    setJob({ kind: "starting", action });
    try {
      const result = await startRunAction({
        action,
        date: action === "resolve" ? undefined : dateFromPath(pathname),
      });
      setJob({ kind: "running", action, runId: result.run_id });
      if (result.run_id == null) {
        window.setTimeout(() => {
          setJob({ kind: "success", action });
          router.refresh();
        }, 90_000);
      }
    } catch (err) {
      setJob({
        kind: "error",
        action,
        message: err instanceof Error ? err.message : "Failed to start",
      });
    }
  }

  const statusText =
    job.kind === "starting"
      ? `Starting ${ACTION_LABEL[job.action]}…`
      : job.kind === "running"
        ? `${ACTION_LABEL[job.action]} running…`
        : job.kind === "success"
          ? `${ACTION_LABEL[job.action]} finished`
          : job.kind === "error"
            ? job.message
            : null;

  return (
    <div ref={rootRef} style={{ marginLeft: "auto", position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          ...btnBase,
          opacity: busy ? 0.6 : 1,
          cursor: busy ? "wait" : "pointer",
          color: "var(--text-primary)",
        }}
      >
        Actions
        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            minWidth: "240px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "6px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            zIndex: 60,
          }}
        >
          {ACTIONS.map((item) => (
            <button
              key={item.action}
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={() => start(item.action)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: "transparent",
                border: "none",
                borderRadius: "6px",
                padding: "10px 12px",
                cursor: busy ? "not-allowed" : "pointer",
                color: "var(--text-primary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-card-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                {item.hint}
              </div>
            </button>
          ))}
        </div>
      )}

      {statusText && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            whiteSpace: "nowrap",
            fontSize: "11px",
            color:
              job.kind === "error"
                ? "var(--lost)"
                : job.kind === "success"
                  ? "var(--won)"
                  : "var(--text-muted)",
            pointerEvents: "none",
            display: open ? "none" : "block",
          }}
        >
          {statusText}
        </div>
      )}
    </div>
  );
}
