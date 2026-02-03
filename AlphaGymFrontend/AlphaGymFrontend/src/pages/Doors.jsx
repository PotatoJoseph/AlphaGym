import { useState } from "react";
import api from "../api/client";

export default function Doors() {
  const [status, setStatus] = useState("Idle");

  const run = async (fn, label) => {
    try {
      setStatus(`${label}...`);
      await fn();
      setStatus(`${label} ✅`);
      setTimeout(() => setStatus("Idle"), 1200);
    } catch (e) {
      setStatus(`${label} ❌ (${e.message})`);
    }
  };

  return (
    <div>
      <h2 className="ag-sectionTitle">Doors</h2>

      <div className="ag-card">
        <div style={{ fontWeight: 900, letterSpacing: "0.02em" }}>Door Control</div>
        <div className="ag-muted" style={{ fontSize: 12, marginTop: 6 }}>
          Backend team will connect to the controller. These buttons call API endpoints.
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button className="ag-btn ag-btnPrimary" type="button" onClick={() => run(api.openDoor, "Open Door")}>
            Open Door
          </button>
          <button className="ag-btn" type="button" onClick={() => run(api.lockDoor, "Lock Door")}>
            Lock Door
          </button>
        </div>

        <div className="ag-muted" style={{ marginTop: 12, fontSize: 12 }}>
          Status: <span style={{ color: "rgba(255,255,255,0.92)" }}>{status}</span>
        </div>
      </div>
    </div>
  );
}
