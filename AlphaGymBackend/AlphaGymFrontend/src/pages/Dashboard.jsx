import { useMemo, useState } from "react";
import StatCard from "../components/StatCard";
import "../styles/widgets.css";
import { apiFetch } from "../api/client";

// Demo data (until backend is ready)
const demoTx = [
  { id: 1001, at: "2026-02-03 09:22", member: "Ahmad", item: "Monthly Membership", amount: 150 },
  { id: 1002, at: "2026-02-03 10:05", member: "Mariam", item: "Day Pass", amount: 20 },
  { id: 1003, at: "2026-02-02 19:41", member: "Omar", item: "PT Session", amount: 35 },
  { id: 1004, at: "2026-02-02 18:03", member: "Sara", item: "Monthly Membership", amount: 150 },
];

function sum(list) {
  return list.reduce((a, b) => a + (b.amount || 0), 0);
}

export default function Dashboard() {
  const [doorMsg, setDoorMsg] = useState("");
  const [doorBusy, setDoorBusy] = useState(false);

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

  const totals = useMemo(() => {
    const today = demoTx.filter((t) => t.at.startsWith("2026-02-03"));
    const thisWeek = demoTx; // replace with real range logic later
    const thisMonth = demoTx;

    return {
      day: sum(today),
      week: sum(thisWeek),
      month: sum(thisMonth),
    };
  }, []);

  return (
    <div>
      <h2 className="ag-sectionTitle">Overview</h2>

      <div className="ag-grid">
        <div className="ag-col-4">
          <StatCard title="Today" value={`₪${totals.day}`} hint="Sales collected today" accent="green" />
        </div>
        <div className="ag-col-4">
          <StatCard title="This Week" value={`₪${totals.week}`} hint="Sales collected this week" accent="cyan" />
        </div>
        <div className="ag-col-4">
          <StatCard title="This Month" value={`₪${totals.month}`} hint="Sales collected this month" accent="purple" />
        </div>

        <div className="ag-col-8">
          <div className="ag-card">
            <h3 className="ag-sectionTitle" style={{ marginTop: 0 }}>Recent Transactions</h3>
            <table className="ag-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Member</th>
                  <th>Item</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {demoTx.map((t) => (
                  <tr key={t.id}>
                    <td>{t.at}</td>
                    <td>{t.member}</td>
                    <td>{t.item}</td>
                    <td>₪{t.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ag-muted" style={{ marginTop: 10, fontSize: 12 }}>
              Backend will replace demo data with real payments.
            </div>
          </div>
        </div>

        <div className="ag-col-4">
          <div className="ag-card">
            <h3 className="ag-sectionTitle" style={{ marginTop: 0 }}>Door Control</h3>
            <div className="ag-muted" style={{ fontSize: 12, marginBottom: 12 }}>
              Open / Lock gym door (wire it to your controller API).
            </div>

            <button className="ag-btn ag-btnPrimary" style={{ width: "100%" }} type="button" disabled={doorBusy} onClick={() => doorAction("open")}>Open Door</button>
            <div style={{ height: 10 }} />
            <button className="ag-btn ag-btnDanger" style={{ width: "100%" }} type="button" disabled={doorBusy} onClick={() => doorAction("lock")}>Lock Door</button>

            {doorMsg ? (
              <div style={{ marginTop: 12 }} className={doorMsg.toLowerCase().includes("fail") ? "ag-error" : "ag-motto"}>
                {doorMsg}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
