import { useEffect, useMemo, useState } from "react";
import StatCard from "../components/StatCard";
import "../styles/widgets.css";
import { apiFetch } from "../api/client";
import { loadTransactions, getTotals } from "../utils/salesStore";

function fmt(n) {
  return `₪${Number(n || 0).toFixed(0)}`;
}

export default function Dashboard() {
  const [doorMsg, setDoorMsg] = useState("");
  const [doorBusy, setDoorBusy] = useState(false);

  // ✅ Live totals from saved transactions
  const [totals, setTotals] = useState({ today: 0, week: 0, month: 0 });
  const [tx, setTx] = useState([]);

  const recalc = () => {
    const list = loadTransactions();
    setTx(list);
    setTotals(getTotals(list));
  };

  useEffect(() => {
    recalc();
    window.addEventListener("alphagym_sales_updated", recalc);
    return () => window.removeEventListener("alphagym_sales_updated", recalc);
  }, []);

  const recentRows = useMemo(() => {
    // Show latest 8
    return (tx || []).slice(0, 8).map((t) => ({
      id: t.id,
      time: new Date(t.timeISO).toLocaleString(),
      member: t.customer || "Walk-in",
      item:
        t.items && t.items.length
          ? t.items.map((it) => `${it.name} x${it.qty}`).join(", ")
          : "-",
      amount: t.total || 0,
    }));
  }, [tx]);

  const doorAction = async (action) => {
    setDoorBusy(true);
    setDoorMsg("");
    try {
      await apiFetch(`/doors/${action}`, { method: "POST" });
      setDoorMsg(action === "open" ? "Door opened" : "Door locked");
    } catch (e) {
      setDoorMsg(e?.message || "Door request failed");
    } finally {
      setDoorBusy(false);
    }
  };

  return (
    <div>
      <h2 className="ag-sectionTitle">Overview</h2>

      <div className="ag-grid">
        <div className="ag-col-4">
          {/* ✅ use one accent only (alpha) */}
          <StatCard
            title="Today"
            value={fmt(totals.today)}
            hint="Sales collected today"
            accent="alpha"
          />
        </div>

        <div className="ag-col-4">
          <StatCard
            title="This Week"
            value={fmt(totals.week)}
            hint="Sales collected this week"
            accent="alpha"
          />
        </div>

        <div className="ag-col-4">
          <StatCard
            title="This Month"
            value={fmt(totals.month)}
            hint="Sales collected this month"
            accent="alpha"
          />
        </div>

        <div className="ag-col-8">
          <div className="ag-card">
            <h3 className="ag-sectionTitle" style={{ marginTop: 0 }}>
              Recent Transactions
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
                {recentRows.length ? (
                  recentRows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.time}</td>
                      <td>{r.member}</td>
                      <td>{r.item}</td>
                      <td>{fmt(r.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="ag-muted" style={{ padding: 14 }}>
                      No transactions yet. Go to Products → add items → Checkout.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="ag-muted" style={{ marginTop: 10, fontSize: 12 }}>
              Totals are calculated from saved checkouts (localStorage).
            </div>
          </div>
        </div>

        <div className="ag-col-4">
          <div className="ag-card">
            <h3 className="ag-sectionTitle" style={{ marginTop: 0 }}>
              Door Control
            </h3>

            <div className="ag-muted" style={{ fontSize: 12, marginBottom: 12 }}>
              Open / Lock gym door (wire it to your controller API).
            </div>

            <button
              className="ag-btn ag-btnPrimary"
              style={{ width: "100%" }}
              type="button"
              disabled={doorBusy}
              onClick={() => doorAction("open")}
            >
              Open Door
            </button>

            <div style={{ height: 10 }} />

            <button
              className="ag-btn ag-btnDanger"
              style={{ width: "100%" }}
              type="button"
              disabled={doorBusy}
              onClick={() => doorAction("lock")}
            >
              Lock Door
            </button>

            {/* If you don’t have ag-btnForest, remove this button or rename the class */}
            <div style={{ height: 10 }} />
            <button
              className="ag-btn"
              style={{ width: "100%" }}
              type="button"
              disabled={doorBusy}
              onClick={() => setDoorMsg("Member feature is coming soon")}
            >
              Add New Member
            </button>

            {doorMsg ? (
              <div
                style={{ marginTop: 12 }}
                className={doorMsg.toLowerCase().includes("fail") ? "ag-error" : "ag-motto"}
              >
                {doorMsg}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
