import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import "./styles/theme.css";

import Login from "./pages/Login";
import AppLayout from "./shell/AppLayout";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Doors from "./pages/Doors";
import { isAuthed } from "./utils/auth";

const RequireAuth = ({ children }) => {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  return children;
};

const IndexRedirect = () => {
  return isAuthed() ? (
    <Navigate to="/app/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexRedirect />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="sales" element={<Sales />} />
          <Route path="doors" element={<Doors />} />
          <Route index element={<Navigate to="/app/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
