import { useMemo, useState } from "react";
import StatCard from "../components/StatCard";
import "../styles/widgets.css";

// TODO: Replace with API call (backend team)
const demoTx = [
  { id: 2001, date: "2026-02-03", time: "09:22", member: "Ahmad", method: "Cash", item: "Monthly Membership", amount: 150 },
  { id: 2002, date: "2026-02-03", time: "10:05", member: "Mariam", method: "Cash", item: "Day Pass", amount: 20 },
  { id: 2003, date: "2026-02-02", time: "19:41", member: "Omar", method: "Card", item: "PT Session", amount: 35 },
  { id: 2004, date: "2026-02-02", time: "18:03", member: "Sara", method: "Card", item: "Monthly Membership", amount: 150 },
];

function sum(list){ return list.reduce((a,b)=>a+(b.amount||0),0); }

export default function Sales(){
  const [range, setRange] = useState("daily");

  const rows = useMemo(() => {
    // For now: daily means only last day in demo dataset
    if (range === "daily") return demoTx.filter((t) => t.date === "2026-02-03");
    if (range === "weekly") return demoTx; // replace with real filter
    return demoTx; // monthly
  }, [range]);

  const totals = useMemo(() => ({
    total: sum(rows),
    count: rows.length,
    avg: rows.length ? Math.round((sum(rows) / rows.length) * 10) / 10 : 0,
  }), [rows]);

  return (
    <div>
      <h2 className="ag-sectionTitle">Sales</h2>

      <div className="ag-grid">
        <div className="ag-col-12">
          <div className="ag-card" style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 800, letterSpacing: "0.06em" }}>Sales Analytics</div>
              <div className="ag-muted" style={{ fontSize: 12, marginTop: 4 }}>
                Daily / weekly / monthly totals + transaction drill-down.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className={`ag-btn ${range === "daily" ? "ag-btnPrimary" : ""}`} type="button" onClick={() => setRange("daily")}>Daily</button>
              <button className={`ag-btn ${range === "weekly" ? "ag-btnPrimary" : ""}`} type="button" onClick={() => setRange("weekly")}>Weekly</button>
              <button className={`ag-btn ${range === "monthly" ? "ag-btnPrimary" : ""}`} type="button" onClick={() => setRange("monthly")}>Monthly</button>
            </div>
          </div>
        </div>

        <div className="ag-col-4">
          <StatCard title="Total" value={`₪${totals.total}`} hint={`Range: ${range}`} accent="green" />
        </div>
        <div className="ag-col-4">
          <StatCard title="Transactions" value={`${totals.count}`} hint="Count" accent="cyan" />
        </div>
        <div className="ag-col-4">
          <StatCard title="Average" value={`₪${totals.avg}`} hint="Avg per transaction" accent="purple" />
        </div>

        <div className="ag-col-12">
          <div className="ag-card">
            <h3 className="ag-sectionTitle" style={{ marginTop: 0 }}>Details</h3>
            <table className="ag-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Member</th>
                  <th>Item</th>
                  <th>Method</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>{r.time}</td>
                    <td>{r.member}</td>
                    <td>{r.item}</td>
                    <td><span className="ag-pill">{r.method}</span></td>
                    <td>₪{r.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ag-muted" style={{ marginTop: 10, fontSize: 12 }}>
              Hook this to your payments endpoint, e.g. <code style={{ color: "inherit" }}>/sales?range=daily</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
