/** Shared action ids for dashboard → GitHub Actions dispatch (safe for client). */

export type RunAction = "scan" | "resolve" | "pinnacle-check";

export function isRunAction(value: string): value is RunAction {
  return value === "scan" || value === "resolve" || value === "pinnacle-check";
}

export const WORKFLOW_BY_ACTION: Record<RunAction, string> = {
  scan: "wnba-scan.yml",
  resolve: "clv-resolve-closing.yml",
  "pinnacle-check": "wnba-pinnacle-check.yml",
};
