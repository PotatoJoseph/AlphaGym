const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function apiFetch(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // allow backend to return no-content on door ops
  if (res.status === 204) return null;

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}
