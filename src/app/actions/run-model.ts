"use server";

import {
  dispatchWorkflow,
  getWorkflowRun,
  isRunAction,
  type RunAction,
} from "@/lib/github-actions";
import { yesterdayET } from "@/lib/dates";

function normalizeDate(date: string | undefined): string | undefined {
  if (!date) return undefined;
  if (date === "today" || date === "tomorrow") return date;
  if (date === "yesterday") return yesterdayET();
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  return undefined;
}

function assertConfigured() {
  if (!process.env.RUN_MODEL_SECRET) {
    throw new Error("RUN_MODEL_SECRET is not configured");
  }
  if (!process.env.GITHUB_PAT && !process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_PAT is not configured");
  }
}

export async function startRunAction(args: {
  action: string;
  date?: string;
}): Promise<{
  ok: true;
  action: RunAction;
  date: string | null;
  run_id: number | null;
  workflow: string;
  ref: string;
}> {
  assertConfigured();
  if (!isRunAction(args.action)) {
    throw new Error("action must be scan | resolve | pinnacle-check");
  }
  const date =
    args.action === "resolve"
      ? undefined
      : normalizeDate(args.date) ?? "today";
  if (args.action !== "resolve" && args.date != null && normalizeDate(args.date) === undefined) {
    throw new Error("date must be today | tomorrow | yesterday | YYYY-MM-DD");
  }

  const result = await dispatchWorkflow({
    action: args.action,
    date,
  });

  return {
    ok: true,
    action: args.action,
    date: args.action === "resolve" ? null : (date ?? "today"),
    run_id: result.runId,
    workflow: result.workflow,
    ref: result.ref,
  };
}

export async function getRunActionStatus(runId: number): Promise<{
  ok: true;
  run: {
    id: number;
    status: string;
    conclusion: string | null;
    html_url: string | null;
  };
}> {
  assertConfigured();
  if (!Number.isFinite(runId) || runId <= 0) {
    throw new Error("Invalid run_id");
  }
  const run = await getWorkflowRun(runId);
  return { ok: true, run };
}
