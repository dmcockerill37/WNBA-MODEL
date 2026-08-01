import { getHistoryRows } from "@/lib/queries";
import { rowGameDate } from "@/lib/types";
import HistoryList from "@/components/HistoryList";

export const revalidate = 300;

export default async function HistoryPage() {
  const rows = await getHistoryRows(300);

  const byDate = rows.reduce<Record<string, typeof rows>>((acc, row) => {
    const d = rowGameDate(row) ?? "unknown";
    if (!acc[d]) acc[d] = [];
    acc[d].push(row);
    return acc;
  }, {});

  const dateKeys = Object.keys(byDate).sort((a, b) => {
    if (a === "unknown") return 1;
    if (b === "unknown") return -1;
    return b.localeCompare(a);
  });

  const groups = dateKeys.map((date) => ({ date, rows: byDate[date] }));

  return (
    <div className="page-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>
          History
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          Clean model picks with win/loss and the actual prop result when settled.
        </p>
      </div>

      {groups.length === 0 ? (
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            padding: "48px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          No scan history yet.
        </div>
      ) : (
        <HistoryList groups={groups} />
      )}
    </div>
  );
}
