import { NextRequest, NextResponse } from "next/server";
import { yesterdayET } from "@/lib/dates";
import {
  assertRunSecret,
  dispatchWorkflow,
  isRunAction,
} from "@/lib/github-actions";

function normalizeDate(date: string | undefined): string | undefined {
  if (!date) return undefined;
  if (date === "today" || date === "tomorrow") return date;
  if (date === "yesterday") return yesterdayET();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  return undefined;
}

// POST /api/run-action — dispatch a bet-model GitHub Actions workflow
export async function POST(req: NextRequest) {
  try {
    assertRunSecret(req.headers.get("x-run-secret"));
  } catch (err) {
    const status = (err as Error & { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("action" in body)) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  const actionRaw = (body as { action: unknown }).action;
  if (typeof actionRaw !== "string" || !isRunAction(actionRaw)) {
    return NextResponse.json(
      { error: "action must be scan | resolve | pinnacle-check" },
      { status: 400 },
    );
  }

  const dateRaw = (body as { date?: unknown }).date;
  const date =
    typeof dateRaw === "string" ? normalizeDate(dateRaw) : undefined;
  if (actionRaw !== "resolve" && dateRaw != null && date === undefined) {
    return NextResponse.json(
      { error: 'date must be today | tomorrow | yesterday | YYYY-MM-DD' },
      { status: 400 },
    );
  }

  try {
    const result = await dispatchWorkflow({
      action: actionRaw,
      date: date ?? (actionRaw === "resolve" ? undefined : "today"),
    });
    return NextResponse.json({
      ok: true,
      action: actionRaw,
      date: actionRaw === "resolve" ? null : (date ?? "today"),
      workflow: result.workflow,
      run_id: result.runId,
      ref: result.ref,
    });
  } catch (err) {
    console.error("run-action error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Dispatch failed" },
      { status: 502 },
    );
  }
}
