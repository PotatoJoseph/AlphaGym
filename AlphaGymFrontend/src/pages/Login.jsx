import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // fake login for now
    navigate("/");
  };

  return (
    <div
      style={{
        height: "100vh",
        backgroundColor: "black",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ color: "orange" }}>Login</h1>

        <button
          onClick={handleLogin}
          style={{
            marginTop: "20px",
            padding: "10px 25px",
            backgroundColor: "orange",
            color: "black",
            border: "none",
            cursor: "pointer",
            borderRadius: "5px",
          }}
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;
