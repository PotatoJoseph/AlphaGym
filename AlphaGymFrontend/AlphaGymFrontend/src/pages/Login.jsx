import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { setToken } from "../utils/auth";
import logo from "../assets/alpha-logo.jpg";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const canLogin = useMemo(
    () => username.trim().length > 0 && password.trim().length > 0,
    [username, password]
  );

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (!canLogin) {
      setError("Enter username and password");
      return;
    }

    setToken("demo-token");
    navigate("/app/dashboard", { replace: true });
  };

  return (
    <div className="ag-loginRoot">
      <div className="ag-loginGlow" />

      <form className="ag-loginCard" onSubmit={handleLogin}>
        <div className="ag-loginHeader">
          <div className="ag-loginLogoWrap">
            <img src={logo} alt="AlphaGym Logo" className="ag-loginLogo" />
          </div>
        </div>

        <label className="ag-label">
          Username
          <input
            className="ag-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="owner"
            autoComplete="username"
          />
        </label>

        <label className="ag-label">
          Password
          <input
            className="ag-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>

        <div className="ag-motto">Strong today, stronger tomorrow</div>

        {error ? <div className="ag-error">{error}</div> : null}

        <button
          className={`ag-btn ag-btnPrimary ag-loginBtn ${canLogin ? "" : "disabled"}`}
          type="submit"
          disabled={!canLogin}
        >
          Login
        </button>

        <div className="ag-loginFoot ag-muted">(Demo UI) Backend will plug in real login later.</div>
      </form>
    </div>
  );
}
