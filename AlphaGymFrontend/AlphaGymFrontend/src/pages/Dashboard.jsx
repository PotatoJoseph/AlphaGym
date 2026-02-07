import { useEffect, useMemo, useState } from "react";
import StatCard from "../components/StatCard";
import "../styles/widgets.css";
import { apiFetch } from "../api/client";
import { loadTransactions, getTotals } from "../utils/salesStore";

// Dashboard-only Access Log (ENTER ONLY)
const demoAccess = [
  { id: 9001, at: "2026-02-04 09:02", member: "Ahmad" },
  { id: 9002, at: "2026-02-04 10:11", member: "Mariam" },
  { id: 9003, at: "2026-02-04 11:30", member: "Omar" },
  { id: 9004, at: "2026-02-04 12:05", member: "Sara" },
];

export default function Dashboard() {
  const [doorMsg, setDoorMsg] = useState("");
  const [doorBusy, setDoorBusy] = useState(false);
  const [totals, setTotals] = useState({ today: 0, week: 0, month: 0 });
  const [accessLogs, setAccessLogs] = useState([]);

  // Fetch real sales stats and logs
  const refreshData = async () => {
    try {
      const logs = await apiFetch("/AccessLogs");
      setAccessLogs(logs);

      const sales = await apiFetch("/Sales");
      calculateTotals(sales);
    } catch (e) {
      console.error("Dashboard refresh failed", e);
    }
  };

  const calculateTotals = (sales) => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayTotal = sales
      .filter(s => new Date(s.createdAt) >= startOfDay)
      .reduce((sum, s) => sum + s.totalAmount, 0);

    const weekTotal = sales
      .filter(s => new Date(s.createdAt) >= startOfWeek)
      .reduce((sum, s) => sum + s.totalAmount, 0);

    const monthTotal = sales
      .filter(s => new Date(s.createdAt) >= startOfMonth)
      .reduce((sum, s) => sum + s.totalAmount, 0);

    setTotals({ today: todayTotal, week: weekTotal, month: monthTotal });
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const doorAction = async (action) => {
    // ... same as before but maybe add 'member' logic if needed
    if (action === "member") {
      // Navigate to add member or show modal
      window.location.hash = "#/Members/add";
      return;
    }
    setDoorBusy(true);
    setDoorMsg("");
    try {
      await apiFetch(`/Doors/${action}`, { method: "POST" });
      if (action === "open") setDoorMsg("Door opened");
      else if (action === "lock") setDoorMsg("Door locked");
      refreshData();
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
          <StatCard
            title="Today"
            value={`₪${totals.today.toFixed(2)}`}
            hint="Sales collected today"
            accent="alpha"
          />
        </div>

        <div className="ag-col-4">
          <StatCard
            title="This Week"
            value={`₪${totals.week.toFixed(2)}`}
            hint="Sales collected this week"
            accent="alpha"
          />
        </div>

        <div className="ag-col-4">
          <StatCard
            title="This Month"
            value={`₪${totals.month.toFixed(2)}`}
            hint="Sales collected this month"
            accent="alpha"
          />
        </div>

        {/* ACCESS LOG */}
        <div className="ag-col-8">
          <div className="ag-card">
            <h3 className="ag-sectionTitle" style={{ marginTop: 0 }}>
              Access Log
            </h3>

            <table className="ag-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>

              <tbody>
                {accessLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.fullName}</td>
                    <td>{log.action}</td>
                    <td>
                      <span className={`ag-pill ${log.subscriptionStatus === "Active" ? "ag-pillSuccess" : "ag-pillDanger"}`}>
                        {log.subscriptionStatus}
                      </span>
                    </td>
                    <td>{new Date(log.time).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="ag-muted" style={{ marginTop: 10, fontSize: 12 }}>
              Access events are shown when members enter the gym.
            </div>
          </div>
        </div>

        {/* Door control */}
        <div className="ag-col-4">
          <div className="ag-card">
            <h3 className="ag-sectionTitle" style={{ marginTop: 0 }}>
              Door Control
            </h3>

            <div className="ag-muted" style={{ fontSize: 12, marginBottom: 12 }}>
              Open / Lock gym door (controller API).
            </div>

            <button
              className="ag-btn ag-btnPrimary"
              style={{ width: "100%" }}
              disabled={doorBusy}
              onClick={() => doorAction("open")}
            >
              Open Door
            </button>

            <div style={{ height: 10 }} />

            <button
              className="ag-btn ag-btnDanger"
              style={{ width: "100%" }}
              disabled={doorBusy}
              onClick={() => doorAction("lock")}
            >
              Lock Door
            </button>

            <div style={{ height: 10 }} />

            {/* ✅ ADD MEMBER BACK */}
            <button
              className="ag-btn ag-btnForest"
              style={{ width: "100%" }}
              disabled={doorBusy}
              onClick={() => doorAction("member")}
            >
              Add New Member
            </button>

            {doorMsg && (
              <div
                style={{ marginTop: 12 }}
                className={
                  doorMsg.toLowerCase().includes("fail")
                    ? "ag-error"
                    : "ag-motto"
                }
              >
                {doorMsg}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
