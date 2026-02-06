import { getToken } from "../utils/auth";

const BASE = import.meta.env.API || "";

export async function apiFetch(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

async function request(path, { method = "GET", body } = {}) {
  return apiFetch(path, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export const api = {
  login: (email, password) => request("/Auth/login", { method: "POST", body: { email, password } }),
  openDoor: () => request("/Doors/open", { method: "POST" }),
  lockDoor: () => request("/Doors/lock", { method: "POST" }),

};

export default api;

