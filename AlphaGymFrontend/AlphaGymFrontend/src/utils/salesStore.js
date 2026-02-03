const KEY = "alphagym_transactions_v1";

/*
Transaction shape:
{
  id: number,
  customer: string,
  total: number,
  timeISO: string,
  items: [{ name, qty, price }]
}
*/

// ============================
// Base helpers
// ============================
export function loadTransactions() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveTransactions(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

// ============================
// CRUD OPERATIONS
// ============================
export function addTransaction(tx) {
  const list = loadTransactions();
  const next = [tx, ...list];
  saveTransactions(next);
  emitSalesUpdate();
  return next;
}

export function removeTransaction(id) {
  const list = loadTransactions();
  const next = list.filter((t) => t.id !== id);
  saveTransactions(next);
  emitSalesUpdate();
  return next;
}

export function updateTransaction(id, updates) {
  const list = loadTransactions();
  const next = list.map((t) =>
    t.id === id ? { ...t, ...updates } : t
  );
  saveTransactions(next);
  emitSalesUpdate();
  return next;
}

// ============================
// TOTALS (Dashboard)
// ============================
export function getTotals(transactions) {
  const now = new Date();

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const startOfWeek = (d) => {
    const x = new Date(d);
    const day = x.getDay(); // 0 Sun - 6 Sat
    const diff = (day + 6) % 7; // Monday start
    x.setDate(x.getDate() - diff);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  const startWeek = startOfWeek(now);

  let today = 0;
  let week = 0;
  let month = 0;

  for (const t of transactions) {
    const dt = new Date(t.timeISO);
    const amount = Number(t.total || 0);

    if (isSameDay(dt, now)) today += amount;
    if (dt >= startWeek) week += amount;
    if (
      dt.getFullYear() === now.getFullYear() &&
      dt.getMonth() === now.getMonth()
    ) {
      month += amount;
    }
  }

  return { today, week, month };
}

// ============================
// WEEKLY GRAPH DATA (Mon–Sun)
// ============================
export function getWeeklySeries(transactions) {
  const now = new Date();

  const startOfWeek = (d) => {
    const x = new Date(d);
    const day = x.getDay();
    const diff = (day + 6) % 7;
    x.setDate(x.getDate() - diff);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  const start = startOfWeek(now);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const totals = new Array(7).fill(0);

  for (const t of transactions) {
    const dt = new Date(t.timeISO);
    for (let i = 0; i < 7; i++) {
      const a = days[i];
      const b = new Date(a);
      b.setDate(a.getDate() + 1);
      if (dt >= a && dt < b) {
        totals[i] += Number(t.total || 0);
        break;
      }
    }
  }

  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return labels.map((label, i) => ({
    label,
    value: totals[i],
  }));
}

// ============================
// EVENT SYSTEM (Live updates)
// ============================
export function emitSalesUpdate() {
  window.dispatchEvent(new Event("alphagym_sales_updated"));
}
