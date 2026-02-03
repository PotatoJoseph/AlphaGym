import { useEffect, useMemo, useState } from "react";
import StatCard from "../components/StatCard";
import "../styles/widgets.css";
import "../styles/sales.css";
import { loadTransactions, getWeeklySeries, getTotals } from "../utils/salesStore";

function fmt(n) {
  return `₪${Number(n || 0).toFixed(0)}`;
}

export default function Sales() {
  const [range, setRange] = useState("weekly");
  const [tx, setTx] = useState([]);

  const recalc = () => {
    const list = loadTransactions();
    setTx(list);
  };

  useEffect(() => {
    recalc();
    window.addEventListener("alphagym_sales_updated", recalc);
    return () => window.removeEventListener("alphagym_sales_updated", recalc);
  }, []);

  // ✅ weekly chart series (Mon..Sun)
  const series = useMemo(() => getWeeklySeries(tx), [tx]);

  // ✅ filter rows by range
  const rows = useMemo(() => {
    const now = new Date();

    const isSameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    const startOfWeek = (d) => {
      const x = new Date(d);
      const day = x.getDay(); // 0 Sun - 6 Sat
      const diff = (day + 6) % 7; // Monday start
      x.setDate(x.getDate() - diff);
      x.setHours(0, 0, 0, 0);
      return x;
    };

    const startWeek = startOfWeek(now);

    if (range === "daily") {
      return tx.filter((t) => isSameDay(new Date(t.timeISO), now));
    }

    if (range === "weekly") {
      return tx.filter((t) => new Date(t.timeISO) >= startWeek);
    }

    // monthly
    return tx.filter((t) => {
      const d = new Date(t.timeISO);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }, [range, tx]);

  const totals = useMemo(() => {
    const total = rows.reduce((sum, t) => sum + Number(t.total || 0), 0);
    const count = rows.length;
    const avg = count ? Math.round((total / count) * 10) / 10 : 0;
    return { total, count, avg };
  }, [rows]);

  // ✅ chart normalization
  const maxVal = useMemo(() => Math.max(...series.map((x) => x.value), 1), [series]);

  // optional: global totals (today/week/month)
  const bigTotals = useMemo(() => getTotals(tx), [tx]);

  // ✅ fixed chart height in pixels
  const CHART_H = 140;

  return (
    <div>
      <h2 className="ag-sectionTitle">Sales</h2>

      <div className="ag-grid">
        {/* Header */}
        <div className="ag-col-12">
          <div
            className="ag-card"
            style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}
          >
            <div>
              <div style={{ fontWeight: 800, letterSpacing: "0.06em" }}>Sales Analytics</div>
              <div className="ag-muted" style={{ fontSize: 12, marginTop: 4 }}>
                Real totals + weekly chart (saved from checkout).
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className={`ag-btn ${range === "daily" ? "ag-btnPrimary" : ""}`}
                type="button"
                onClick={() => setRange("daily")}
              >
                Daily
              </button>
              <button
                className={`ag-btn ${range === "weekly" ? "ag-btnPrimary" : ""}`}
                type="button"
                onClick={() => setRange("weekly")}
              >
                Weekly
              </button>
              <button
                className={`ag-btn ${range === "monthly" ? "ag-btnPrimary" : ""}`}
                type="button"
                onClick={() => setRange("monthly")}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>

        {/* Quick stats for selected range */}
        <div className="ag-col-4">
          <StatCard title="Total" value={fmt(totals.total)} hint={`Range: ${range}`} accent="alpha" />
        </div>
        <div className="ag-col-4">
          <StatCard title="Transactions" value={`${totals.count}`} hint="Count" accent="alpha" />
        </div>
        <div className="ag-col-4">
          <StatCard title="Average" value={fmt(totals.avg)} hint="Avg per transaction" accent="alpha" />
        </div>

        {/* Weekly chart */}
        <div className="ag-col-12">
          <div className="ag-card">
            <div className="ag-sectionTitle" style={{ marginTop: 0 }}>
              Weekly Sales
            </div>

            <div className="ag-muted" style={{ fontSize: 12, marginBottom: 10 }}>
              This week total: {fmt(bigTotals.week)} • Today: {fmt(bigTotals.today)} • Month: {fmt(bigTotals.month)}
            </div>

            {series.length === 0 ? (
              <div className="ag-muted" style={{ fontSize: 12 }}>
                No sales yet this week.
              </div>
            ) : (
              <div className="ag-barChart">
                {series.map((d) => {
                  // ✅ pixel height so it ALWAYS renders correctly
                  const h = Math.max(4, Math.round((d.value / maxVal) * CHART_H));
                  return (
                    <div key={d.label} className="ag-barCol" title={`${d.label}: ₪${d.value}`}>
                      <div className="ag-bar" style={{ height: `${h}px` }} />
                      <div className="ag-barLabel">{d.label}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Details table */}
        <div className="ag-col-12">
          <div className="ag-card">
            <h3 className="ag-sectionTitle" style={{ marginTop: 0 }}>
              Details
            </h3>

            <table className="ag-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {rows.length ? (
                  rows.map((t) => (
                    <tr key={t.id}>
                      <td>{new Date(t.timeISO).toLocaleString()}</td>
                      <td>{t.customer || "Walk-in"}</td>
                      <td>
                        {t.items?.length ? t.items.map((it) => `${it.name} x${it.qty}`).join(", ") : "-"}
                      </td>
                      <td>{fmt(t.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="ag-muted" style={{ padding: 14 }}>
                      No transactions in this range yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="ag-muted" style={{ marginTop: 10, fontSize: 12 }}>
              This is demo-persistence using localStorage. Backend can replace it later.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
