import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../styles/shell.css";
import { clearToken } from "../utils/auth";
import alphaLogo from "../assets/alpha-logo.jpg";

const Icon = ({ name }) => {
  // super-light icon fallback (no extra deps)
  // You can swap these for SVGs later.
  const map = {
    dashboard: "▣",
    sales: "⟐",
    doors: "⏻",
    logout: "⇦",
  };
  return <span className="ag-icon">{map[name] ?? "•"}</span>;
};

export default function AppLayout() {
  const navigate = useNavigate();

  const onLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  return (
    <div className="ag-shell">
      <aside className="ag-sidebar">
        <div className="ag-brand">
          <div className="ag-brandRow">
            <img className="ag-brandLogo" src={alphaLogo} alt="AlphaGym" />
            <div>
              <div className="ag-brandMark">ALPHA</div>
              <div className="ag-brandSub">Gym Control</div>
            </div>
          </div>
        </div>

        <nav className="ag-nav">
          <NavLink to="/app/dashboard" className={({ isActive }) => (isActive ? "ag-link active" : "ag-link")}
          >
            <Icon name="dashboard" /> Dashboard
          </NavLink>

          <NavLink to="/app/sales" className={({ isActive }) => (isActive ? "ag-link active" : "ag-link")}
          >
            <Icon name="sales" /> Sales
          </NavLink>

          <NavLink to="/app/doors" className={({ isActive }) => (isActive ? "ag-link active" : "ag-link")}
          >
            <Icon name="doors" /> Doors
          </NavLink>
        </nav>

        <button className="ag-logout" onClick={onLogout} type="button">
          <Icon name="logout" /> Logout
        </button>
      </aside>

      <div className="ag-main">
        <header className="ag-topbar">
          <div className="ag-topLeft">
            <div className="ag-topTitle">AlphaGym</div>
            <div className="ag-topHint">Neon Ops • Secure Mode</div>
          </div>
          <div className="ag-topRight">
            <div className="ag-statusDot" />
            <div className="ag-statusText">Connected</div>
          </div>
        </header>

        <main className="ag-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
