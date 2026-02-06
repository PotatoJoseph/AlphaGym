import { useEffect, useMemo, useState } from "react";
import StatCard from "../components/StatCard";
import "../styles/widgets.css";
import "../styles/sales.css";
import { loadTransactions, getWeeklySeries, getTotals } from "../utils/salesStore";

function fmt(n) {
  return `₪${Number(n || 0).toFixed(0)}`;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

// Monday-start week
function startOfWeek(d) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 Sun - 6 Sat
  const diff = (day + 6) % 7; // Monday start
  x.setDate(x.getDate() - diff);
  return x;
}

function inRange(iso, min, max) {
  const t = new Date(iso);
  return t >= min && t <= max;
}

export default function Sales() {
  const [range, setRange] = useState("weekly"); // daily | weekly | monthly | yearly
  const [tx, setTx] = useState([]);

  // Monthly sub-range: week 1..4
  const [monthWeek, setMonthWeek] = useState(1);

  // Yearly sub-range: month 0..11
  const [yearMonth, setYearMonth] = useState(new Date().getMonth());

  const recalc = () => setTx(loadTransactions());

  useEffect(() => {
    recalc();
    window.addEventListener("alphagym_sales_updated", recalc);
    return () => window.removeEventListener("alphagym_sales_updated", recalc);
  }, []);

  // Global totals (today/week/month) for the small line under chart
  const bigTotals = useMemo(() => getTotals(tx), [tx]);

  const now = useMemo(() => new Date(), [tx.length]); // cheap refresh anchor

  // ============================
  // Filters for each range
  // ============================
  const rows = useMemo(() => {
    const now = new Date();

    // DAILY = today only
    if (range === "daily") {
      const min = startOfDay(now);
      const max = endOfDay(now);
      return tx.filter((t) => inRange(t.timeISO, min, max));
    }

    // WEEKLY = from Monday -> now
    if (range === "weekly") {
      const min = startOfWeek(now);
      const max = endOfDay(now);
      return tx.filter((t) => inRange(t.timeISO, min, max));
    }

    // MONTHLY = selected week 1..4 within this month
    if (range === "monthly") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Week mapping:
      // W1: 1-7, W2: 8-14, W3: 15-21, W4: 22-end
      const ranges = [
        [1, 7],
        [8, 14],
        [15, 21],
        [22, monthEnd.getDate()],
      ];

      const [a, b] = ranges[Math.max(0, Math.min(3, monthWeek - 1))];
      const min = new Date(now.getFullYear(), now.getMonth(), a);
      const max = new Date(now.getFullYear(), now.getMonth(), b, 23, 59, 59, 999);

      // Ensure we clamp inside month
      const realMin = min < monthStart ? monthStart : min;
      const realMax = max > monthEnd ? endOfDay(monthEnd) : max;

      return tx.filter((t) => inRange(t.timeISO, realMin, realMax));
    }

    // YEARLY = selected month inside this year
    const min = new Date(now.getFullYear(), yearMonth, 1);
    const max = new Date(now.getFullYear(), yearMonth + 1, 0, 23, 59, 59, 999);
    return tx.filter((t) => inRange(t.timeISO, min, max));
  }, [range, tx, monthWeek, yearMonth]);

  // Range totals
  const totals = useMemo(() => {
    const total = rows.reduce((sum, t) => sum + Number(t.total || 0), 0);
    const count = rows.length;
    const avg = count ? Math.round((total / count) * 10) / 10 : 0;
    return { total, count, avg };
  }, [rows]);

  // ============================
  // Chart data depending on range
  // ============================
  const chart = useMemo(() => {
    if (range === "weekly") {
      const s = getWeeklySeries(tx);
      return { title: "Weekly Sales (Mon–Sun)", bars: s };
    }

    if (range === "monthly") {
      // Week 1..4 totals for current month
      const now = new Date();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const weekDefs = [
        { label: "Week 1", a: 1, b: 7 },
        { label: "Week 2", a: 8, b: 14 },
        { label: "Week 3", a: 15, b: 21 },
        { label: "Week 4", a: 22, b: monthEnd.getDate() },
      ];

      const bars = weekDefs.map((w) => {
        const min = new Date(now.getFullYear(), now.getMonth(), w.a);
        const max = new Date(now.getFullYear(), now.getMonth(), w.b, 23, 59, 59, 999);
        const value = tx
          .filter((t) => inRange(t.timeISO, min, max))
          .reduce((sum, t) => sum + Number(t.total || 0), 0);
        return { label: w.label, value };
      });

      return { title: "Monthly Sales (Weeks)", bars };
    }

    // YEARLY chart: Jan..Dec totals for this year
    const now = new Date();
    const year = now.getFullYear();
    const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const bars = monthLabels.map((label, m) => {
      const min = new Date(year, m, 1);
      const max = new Date(year, m + 1, 0, 23, 59, 59, 999);
      const value = tx
        .filter((t) => inRange(t.timeISO, min, max))
        .reduce((sum, t) => sum + Number(t.total || 0), 0);
      return { label, value };
    });

    return { title: "Yearly Sales (Months)", bars };
  }, [range, tx]);

  const maxVal = useMemo(() => Math.max(...chart.bars.map((x) => x.value), 1), [chart]);
  const CHART_H = 140;

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

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
                Daily / weekly / monthly (weeks) / yearly (months).
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button className={`ag-btn ${range === "daily" ? "ag-btnPrimary" : ""}`} type="button" onClick={() => setRange("daily")}>
                Daily
              </button>
              <button className={`ag-btn ${range === "weekly" ? "ag-btnPrimary" : ""}`} type="button" onClick={() => setRange("weekly")}>
                Weekly
              </button>
              <button
                className={`ag-btn ${range === "monthly" ? "ag-btnPrimary" : ""}`}
                type="button"
                onClick={() => {
                  setRange("monthly");
                  setMonthWeek(1);
                }}
              >
                Monthly
              </button>
              <button
                className={`ag-btn ${range === "yearly" ? "ag-btnPrimary" : ""}`}
                type="button"
                onClick={() => {
                  setRange("yearly");
                  setYearMonth(new Date().getMonth());
                }}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>

        {/* ✅ Monthly sub buttons: Week 1..4 */}
        {range === "monthly" && (
          <div className="ag-col-12">
            <div className="ag-card" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ fontWeight: 800 }}>Select Week</div>
              {[1,2,3,4].map((w) => (
                <button
                  key={w}
                  className={`ag-btn ${monthWeek === w ? "ag-btnPrimary" : ""}`}
                  type="button"
                  onClick={() => setMonthWeek(w)}
                >
                  Week {w}
                </button>
              ))}
              <div className="ag-muted" style={{ fontSize: 12 }}>
                ({monthNames[new Date().getMonth()]})
              </div>
            </div>
          </div>
        )}

        {/* ✅ Yearly sub buttons: 12 months */}
        {range === "yearly" && (
          <div className="ag-col-12">
            <div className="ag-card" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ fontWeight: 800 }}>Select Month</div>
              {monthNames.map((m, idx) => (
                <button
                  key={m}
                  className={`ag-btn ${yearMonth === idx ? "ag-btnPrimary" : ""}`}
                  type="button"
                  onClick={() => setYearMonth(idx)}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
              <div className="ag-muted" style={{ fontSize: 12 }}>
                ({new Date().getFullYear()})
              </div>
            </div>
          </div>
        )}

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

        {/* Chart */}
        <div className="ag-col-12">
          <div className="ag-card">
            <div className="ag-sectionTitle" style={{ marginTop: 0 }}>
              {chart.title}
            </div>

            <div className="ag-muted" style={{ fontSize: 12, marginBottom: 10 }}>
              This week: {fmt(bigTotals.week)} • Today: {fmt(bigTotals.today)} • Month: {fmt(bigTotals.month)}
            </div>

            <div className="ag-barChart">
              {chart.bars.map((d) => {
                const h = Math.max(4, Math.round((d.value / maxVal) * CHART_H));
                return (
                  <div key={d.label} className="ag-barCol" title={`${d.label}: ₪${d.value}`}>
                    <div className="ag-bar" style={{ height: `${h}px` }} />
                    <div className="ag-barLabel">{d.label}</div>
                  </div>
                );
              })}
            </div>
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
