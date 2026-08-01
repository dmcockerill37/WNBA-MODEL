/**
 * GitHub Actions helpers for dispatching bet-model workflows from the dashboard.
 * PAT stays server-side only (GITHUB_PAT / GITHUB_TOKEN).
 */

import {
  WORKFLOW_BY_ACTION,
  type RunAction,
  isRunAction,
} from "@/lib/run-actions";

export type { RunAction };
export { isRunAction };

function githubConfig() {
  const token = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || "dmcockerill37/bet-model";
  if (!token) {
    throw new Error("GITHUB_PAT is not configured");
  }
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    throw new Error("GITHUB_REPO must be owner/name");
  }
  return { token, owner, name, repo };
}

async function ghFetch(path: string, init?: RequestInit): Promise<Response> {
  const { token } = githubConfig();
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
  });
}

export async function dispatchWorkflow(args: {
  action: RunAction;
  date?: string;
}): Promise<{ workflow: string; runId: number | null }> {
  const { owner, name } = githubConfig();
  const workflow = WORKFLOW_BY_ACTION[args.action];

  const inputs: Record<string, string> = {};
  if (args.action !== "resolve" && args.date) {
    inputs.date = args.date;
  }

  const dispatchedAt = Date.now();
  const res = await ghFetch(
    `/repos/${owner}/${name}/actions/workflows/${workflow}/dispatches`,
    {
      method: "POST",
      body: JSON.stringify({
        ref: "main",
        inputs,
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`workflow_dispatch failed (${res.status}): ${body}`);
  }

  // workflow_dispatch returns 204 with no run id — look up the newest run.
  const runId = await findRecentRun({
    workflow,
    sinceMs: dispatchedAt - 5_000,
  });

  return { workflow, runId };
}

async function findRecentRun(args: {
  workflow: string;
  sinceMs: number;
}): Promise<number | null> {
  const { owner, name } = githubConfig();
  const res = await ghFetch(
    `/repos/${owner}/${name}/actions/workflows/${args.workflow}/runs?per_page=5&event=workflow_dispatch`,
  );
  if (!res.ok) return null;

  const data: unknown = await res.json();
  if (
    typeof data !== "object" ||
    data === null ||
    !("workflow_runs" in data) ||
    !Array.isArray((data as { workflow_runs: unknown }).workflow_runs)
  ) {
    return null;
  }

  const runs = (data as { workflow_runs: Array<Record<string, unknown>> }).workflow_runs;
  for (const run of runs) {
    const created = typeof run.created_at === "string" ? Date.parse(run.created_at) : 0;
    if (created >= args.sinceMs && typeof run.id === "number") {
      return run.id;
    }
  }
  return typeof runs[0]?.id === "number" ? runs[0].id : null;
}

export type WorkflowRunStatus = {
  id: number;
  status: string;
  conclusion: string | null;
  html_url: string | null;
  display_title: string | null;
};

export async function getWorkflowRun(runId: number): Promise<WorkflowRunStatus> {
  const { owner, name } = githubConfig();
  const res = await ghFetch(`/repos/${owner}/${name}/actions/runs/${runId}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`get run failed (${res.status}): ${body}`);
  }
  const data: unknown = await res.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("invalid run response");
  }
  const run = data as Record<string, unknown>;
  return {
    id: typeof run.id === "number" ? run.id : runId,
    status: typeof run.status === "string" ? run.status : "unknown",
    conclusion: typeof run.conclusion === "string" ? run.conclusion : null,
    html_url: typeof run.html_url === "string" ? run.html_url : null,
    display_title: typeof run.display_title === "string" ? run.display_title : null,
  };
}

export function assertRunSecret(headerValue: string | null): void {
  const expected = process.env.RUN_MODEL_SECRET;
  if (!expected) {
    throw new Error("RUN_MODEL_SECRET is not configured");
  }
  if (!headerValue || headerValue !== expected) {
    const err = new Error("Unauthorized");
    (err as Error & { status: number }).status = 401;
    throw err;
  }
}
