const BASE = import.meta.env.VITE_API_BASE_URL || "";

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
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
  openDoor: () => request("/doors/open", { method: "POST" }),
  lockDoor: () => request("/doors/lock", { method: "POST" }),
};

export default api;
