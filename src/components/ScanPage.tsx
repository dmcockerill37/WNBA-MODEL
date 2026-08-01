import { getScanRows, getPlacedKeys } from "@/lib/queries";
import { formatDisplayDate } from "@/lib/dates";
import ScanTable from "./ScanTable";

interface Props {
  gameDate: string;
  label: string;
}

export default async function ScanPage({ gameDate, label }: Props) {
  const [rows, placedKeys] = await Promise.all([
    getScanRows(gameDate),
    getPlacedKeys(gameDate),
  ]);

  const clean = rows.filter((r) => !r.needs_review).length;
  const review = rows.filter((r) => r.needs_review).length;
  const snapshotTime = rows[0]?.snapshot_taken_at;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}>
      {/* header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            {label}
          </h1>
          <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            {formatDisplayDate(gameDate)}
          </span>
        </div>
        {rows.length > 0 ? (
          <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
            <span>
              <span style={{ color: "#34d399", fontWeight: 600 }}>{clean}</span> clean
            </span>
            <span>
              <span style={{ color: "#fbbf24", fontWeight: 600 }}>{review}</span> needs review
            </span>
            {snapshotTime && (
              <span style={{ color: "var(--text-muted)" }}>
                Last scan:{" "}
                {new Date(snapshotTime).toLocaleTimeString("en-US", {
                  timeZone: "America/New_York",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZoneName: "short",
                })}
              </span>
            )}
          </div>
        ) : (
          <div style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-muted)" }}>
            No scan data yet. Run{" "}
            <code
              style={{
                background: "var(--bg-card)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            >
              /scan-wnba {label.toLowerCase()}
            </code>{" "}
            to populate.
          </div>
        )}
      </div>

      <ScanTable rows={rows} gameDate={gameDate} placedKeys={placedKeys} />
    </div>
  );
}
