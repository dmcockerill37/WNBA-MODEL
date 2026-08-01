import { NextRequest, NextResponse } from "next/server";
import { assertRunSecret, getWorkflowRun } from "@/lib/github-actions";

// GET /api/run-status?run_id=123 — poll a dispatched GitHub Actions run
export async function GET(req: NextRequest) {
  try {
    assertRunSecret(req.headers.get("x-run-secret"));
  } catch (err) {
    const status = (err as Error & { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status },
    );
  }

  const runIdRaw = req.nextUrl.searchParams.get("run_id");
  const runId = runIdRaw ? Number(runIdRaw) : NaN;
  if (!Number.isFinite(runId) || runId <= 0) {
    return NextResponse.json({ error: "Missing or invalid run_id" }, { status: 400 });
  }

  try {
    const run = await getWorkflowRun(runId);
    return NextResponse.json({ ok: true, run });
  } catch (err) {
    console.error("run-status error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Status lookup failed" },
      { status: 502 },
    );
  }
}
