import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";

const Home = () => {
  return (
    <section
      style={{
        height: "calc(100vh - 80px)",
        backgroundColor: "black",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ color: "orange", fontSize: "48px" }}>
          Build Your Best Body
        </h1>
        <p style={{ marginTop: "20px", fontSize: "18px" }}>
          Train hard. Stay consistent. Become unstoppable.
        </p>
      </div>
    </section>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
