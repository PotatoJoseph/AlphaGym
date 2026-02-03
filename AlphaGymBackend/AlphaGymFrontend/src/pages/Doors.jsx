import { useState } from "react";
import { apiFetch } from "../api/client";

export default function Doors(){
  const [status, setStatus] = useState("idle");
  const [msg, setMsg] = useState("");

  const run = async (action) => {
    setStatus("loading");
    setMsg("");
    try {
      // Backend should implement these endpoints:
      // POST /doors/open
      // POST /doors/lock
      await apiFetch(`/doors/${action}`, { method: "POST" });
      setStatus("ok");
      setMsg(action === "open" ? "Door opened" : "Door locked");
    } catch (e) {
      setStatus("error");
      setMsg(e?.message || "Request failed");
    }
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <h2 className="ag-sectionTitle">Doors</h2>

      <div className="ag-card">
        <div style={{ fontWeight: 900, letterSpacing: "0.06em" }}>Door Control Panel</div>
        <div className="ag-muted" style={{ marginTop: 6, fontSize: 12 }}>
          Connect these buttons to your access controller backend.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
          <button className="ag-btn ag-btnPrimary" type="button" onClick={() => run("open")} disabled={status === "loading"}>
            Open Door
          </button>
          <button className="ag-btn ag-btnDanger" type="button" onClick={() => run("lock")} disabled={status === "loading"}>
            Lock Door
          </button>
        </div>

        {msg ? (
          <div style={{ marginTop: 14 }} className={status === "error" ? "ag-error" : "ag-motto"}>
            {msg}
          </div>
        ) : null}

        <div className="ag-muted" style={{ marginTop: 12, fontSize: 12 }}>
          Set your API base URL in <code style={{ color: "inherit" }}>.env</code> using <code style={{ color: "inherit" }}>VITE_API_BASE_URL</code>.
        </div>
      </div>
    </div>
  );
}
