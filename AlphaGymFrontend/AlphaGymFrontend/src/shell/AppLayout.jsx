import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../styles/shell.css";
import logo from "../assets/alpha-logo.jpg";
import { clearToken } from "../utils/auth";

export default function AppLayout() {
  const navigate = useNavigate();

  const logout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  return (
    <div className="ag-shell">
      <aside className="ag-sidebar">
        {/* Top-left brand (small logo like you want) */}
        <div className="ag-brand">
          <img src={logo} alt="AlphaGym" className="ag-brandLogo" />
          <div className="ag-brandText">
            <div className="ag-brandName">AlphaGym</div>
            <div className="ag-brandSub">Management</div>
          </div>
        </div>

        <nav className="ag-nav">
          <NavLink
            to="/app/dashboard"
            className={({ isActive }) => (isActive ? "ag-link active" : "ag-link")}
          >
            📊 Dashboard
          </NavLink>

          <NavLink
            to="/app/products"
            className={({ isActive }) => (isActive ? "ag-link active" : "ag-link")}
          >
            🧾 Products
          </NavLink>

          <NavLink
            to="/app/sales"
            className={({ isActive }) => (isActive ? "ag-link active" : "ag-link")}
          >
            💰 Sales
          </NavLink>

          <NavLink
            to="/app/doors"
            className={({ isActive }) => (isActive ? "ag-link active" : "ag-link")}
          >
            🚪 Doors
          </NavLink>

          <button className="ag-btn ag-sidebarLogout" type="button" onClick={logout}>
            Logout
          </button>
        </nav>
      </aside>

      <main className="ag-main">
        <div className="ag-topbar">
          <div className="ag-topbarTitle">AlphaGym Console</div>
          <div className="ag-topbarStatus">Connected (demo)</div>
        </div>

        <div className="ag-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
