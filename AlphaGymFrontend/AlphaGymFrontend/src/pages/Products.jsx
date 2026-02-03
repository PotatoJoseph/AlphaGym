import { useEffect, useMemo, useState } from "react";
import "../styles/widgets.css";

// Sales storage (must exist in src/utils/salesStore.js)
import {
  addTransaction,
  loadTransactions,
  updateTransaction,
  removeTransaction,
} from "../utils/salesStore";

/**
 * Products storage (frontend only)
 * Backend team will replace later.
 */
const PRODUCTS_KEY = "alphagym_products_v1";

function loadProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveProducts(list) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
}

// Read uploaded image as dataURL so it persists after refresh
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function money(n) {
  const x = Number(n || 0);
  return `₪${x}`;
}

export default function Products() {
  // ===== Products
  const [products, setProducts] = useState(() => {
    const existing = loadProducts();
    if (existing.length) return existing;

    // Seed default products once
    const seeded = [
      { id: 1, name: "ALPHA Protein Bar", price: 8, photo: "" },
      { id: 2, name: "ALPHA Water", price: 5, photo: "" },
      { id: 3, name: "ALPHA Day Pass", price: 20, photo: "" },
    ];
    saveProducts(seeded);
    return seeded;
  });

  // ===== Cart
  const [cart, setCart] = useState([]); // [{id,name,price,qty,photo}]
  const [customerName, setCustomerName] = useState("");

  // ===== Purchase History (transactions)
  const [history, setHistory] = useState(() => loadTransactions());

  // ===== New Product Modal
  const [showNew, setShowNew] = useState(false);
  const [npName, setNpName] = useState("");
  const [npPrice, setNpPrice] = useState("");
  const [npFile, setNpFile] = useState(null);

  // ===== Edit Transaction Modal
  const [editing, setEditing] = useState(null);
  const [editCustomer, setEditCustomer] = useState("");
  const [editTotal, setEditTotal] = useState("");

  // Keep history in sync if other pages update salesStore
  useEffect(() => {
    const refresh = () => setHistory(loadTransactions());
    refresh();
    window.addEventListener("alphagym_sales_updated", refresh);
    return () => window.removeEventListener("alphagym_sales_updated", refresh);
  }, []);

  // ===== Derived totals
  const cartTotal = useMemo(
    () => cart.reduce((sum, x) => sum + Number(x.price || 0) * Number(x.qty || 0), 0),
    [cart]
  );

  // ===== Cart handlers
  const addToCart = (p) => {
    setCart((prev) => {
      const found = prev.find((x) => x.id === p.id);
      if (found) {
        return prev.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x));
      }
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1, photo: p.photo || "" }];
    });
  };

  const minusQty = (id) => {
    setCart((prev) =>
      prev
        .map((x) => (x.id === id ? { ...x, qty: x.qty - 1 } : x))
        .filter((x) => x.qty > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((x) => x.id !== id));
  };

  const clearCart = () => setCart([]);

  // ===== Checkout handler
  const checkout = () => {
    if (!cart.length) return;

    const tx = {
      id: Date.now(),
      customer: customerName.trim() || "Walk-in",
      total: cartTotal,
      timeISO: new Date().toISOString(),
      items: cart.map((x) => ({ name: x.name, qty: x.qty, price: x.price })),
    };

    addTransaction(tx); // persists + emits update event
    setHistory(loadTransactions()); // update local state

    setCustomerName("");
    clearCart();
  };

  // ===== New product create
  const createProduct = async () => {
    const name = npName.trim();
    const price = Number(npPrice);

    if (!name || !Number.isFinite(price) || price <= 0) return;

    let photo = "";
    if (npFile) {
      try {
        photo = await fileToDataUrl(npFile);
      } catch {
        photo = "";
      }
    }

    const next = [
      {
        id: Date.now(),
        name,
        price,
        photo,
      },
      ...products,
    ];

    setProducts(next);
    saveProducts(next);

    // reset
    setNpName("");
    setNpPrice("");
    setNpFile(null);
    setShowNew(false);
  };

  // ===== Transaction editing
  const startEdit = (tx) => {
    setEditing(tx);
    setEditCustomer(tx.customer || "");
    setEditTotal(String(tx.total ?? ""));
  };

  const saveEdit = () => {
    if (!editing) return;

    updateTransaction(editing.id, {
      customer: editCustomer.trim() || "Walk-in",
      total: Number(editTotal) || 0,
    });

    setHistory(loadTransactions());
    setEditing(null);
  };

  const cancelEdit = () => setEditing(null);

  return (
    <div>
      <h2 className="ag-sectionTitle">Products</h2>
      <div className="ag-muted" style={{ fontSize: 12, marginBottom: 10 }}>
        Add products, then add to cart and checkout.
      </div>

      {/* TOP ACTIONS (ONLY ONE New Product button) */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button className="ag-btn ag-btnPrimary" type="button" onClick={() => setShowNew(true)}>
          + New Product
        </button>
      </div>

      <div className="ag-grid">
        {/* LEFT: Catalog */}
        <div className="ag-col-8">
          <div className="ag-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900, letterSpacing: "0.06em" }}>Catalog</div>
              <div className="ag-muted" style={{ fontSize: 12 }}>
                Click “Add” to put items in cart
              </div>
            </div>

            {/* Horizontal layout */}
            <div
              style={{
                marginTop: 12,
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              {products.map((p) => (
                <div
                  key={p.id}
                  style={{
                    width: "min(220px, 100%)",
                    flex: "0 0 220px",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 14,
                    background: "rgba(10,12,16,0.55)",
                    overflow: "hidden",
                  }}
                >
                  {/* Photo (CAPPED so it never fills screen) */}
                  <div
                    style={{
                      width: "100%",
                      height: 120,
                      background: "rgba(255,122,24,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {p.photo ? (
                      <img
                        src={p.photo}
                        alt={p.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <div className="ag-muted" style={{ fontSize: 12 }}>
                        No photo
                      </div>
                    )}
                  </div>

                  <div style={{ padding: 12 }}>
                    <div style={{ fontWeight: 800 }}>{p.name}</div>
                    <div className="ag-muted" style={{ marginTop: 6, fontSize: 12 }}>
                      {money(p.price)}
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <button className="ag-btn ag-btnPrimary" type="button" onClick={() => addToCart(p)}>
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Cart */}
        <div className="ag-col-4">
          <div className="ag-card">
            <div style={{ fontWeight: 900, letterSpacing: "0.06em" }}>Cart</div>
            <div className="ag-muted" style={{ fontSize: 12, marginTop: 4 }}>
              Add items from the catalog.
            </div>

            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {cart.length === 0 ? (
                <div className="ag-muted" style={{ fontSize: 12 }}>
                  No items yet.
                </div>
              ) : (
                cart.map((x) => (
                  <div
                    key={x.id}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(0,0,0,0.20)",
                    }}
                  >
                    {/* Tiny photo */}
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "rgba(255,122,24,0.08)",
                        flexShrink: 0,
                      }}
                    >
                      {x.photo ? (
                        <img
                          src={x.photo}
                          alt={x.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      ) : null}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{x.name}</div>
                      <div className="ag-muted" style={{ fontSize: 12 }}>
                        {money(x.price)} · Qty {x.qty}
                      </div>
                    </div>

                    {/* Controls */}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="ag-btn" type="button" onClick={() => minusQty(x.id)} title="Minus">
                        −
                      </button>
                      <button className="ag-btn" type="button" onClick={() => addToCart(x)} title="Plus">
                        +
                      </button>
                      <button
                        className="ag-btn"
                        type="button"
                        onClick={() => removeFromCart(x.id)}
                        title="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              <label className="ag-label">
                Customer Name
                <input
                  className="ag-input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ahmad"
                />
              </label>
            </div>

            <div style={{ marginTop: 12, fontWeight: 900 }}>
              Total: {money(cartTotal)}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <button
                className="ag-btn ag-btnPrimary"
                type="button"
                onClick={checkout}
                disabled={!cart.length}
                style={{ flex: 1 }}
              >
                Checkout
              </button>
              <button className="ag-btn" type="button" onClick={clearCart} disabled={!cart.length}>
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Purchase History */}
        <div className="ag-col-12">
          <div className="ag-card">
            <div style={{ fontWeight: 900, letterSpacing: "0.06em" }}>Purchase History</div>
            <div className="ag-muted" style={{ fontSize: 12, marginTop: 4 }}>
              Stored locally for now. Backend will replace later.
            </div>

            <div style={{ marginTop: 12 }}>
              <table className="ag-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Time</th>
                    <th>Items</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((tx) => {
                    const dt = new Date(tx.timeISO);
                    const itemsText = (tx.items || [])
                      .map((it) => `${it.name} x${it.qty}`)
                      .join(", ");

                    return (
                      <tr key={tx.id}>
                        <td>{tx.customer || "Walk-in"}</td>
                        <td>{money(tx.total)}</td>
                        <td>{dt.toLocaleString()}</td>
                        <td style={{ maxWidth: 680 }}>{itemsText}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button className="ag-btn" type="button" onClick={() => startEdit(tx)} title="Edit">
                            ✏️
                          </button>
                          <button
                            className="ag-btn"
                            type="button"
                            onClick={() => removeTransaction(tx.id)}
                            title="Delete"
                            style={{ marginLeft: 8 }}
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="ag-muted" style={{ fontSize: 12, padding: 14 }}>
                        No purchases yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* New Product Modal */}
      {showNew && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            className="ag-card"
            style={{
              width: "min(520px, 94vw)",
              border: "1px solid rgba(255,122,24,0.25)",
              background: "rgba(18,18,20,0.96)",
            }}
          >
            <div style={{ fontWeight: 900, letterSpacing: "0.06em" }}>New Product</div>

            <label className="ag-label" style={{ marginTop: 12 }}>
              Name
              <input className="ag-input" value={npName} onChange={(e) => setNpName(e.target.value)} />
            </label>

            <label className="ag-label">
              Price
              <input
                className="ag-input"
                type="number"
                value={npPrice}
                onChange={(e) => setNpPrice(e.target.value)}
              />
            </label>

            <label className="ag-label">
              Photo
              <input
                className="ag-input"
                type="file"
                accept="image/*"
                onChange={(e) => setNpFile(e.target.files?.[0] || null)}
              />
            </label>

            <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
              <button className="ag-btn" type="button" onClick={() => setShowNew(false)}>
                Cancel
              </button>
              <button className="ag-btn ag-btnPrimary" type="button" onClick={createProduct}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            className="ag-card"
            style={{
              width: "min(520px, 94vw)",
              border: "1px solid rgba(255,122,24,0.25)",
              background: "rgba(18,18,20,0.96)",
            }}
          >
            <div style={{ fontWeight: 900, letterSpacing: "0.06em" }}>Edit Transaction</div>

            <label className="ag-label" style={{ marginTop: 12 }}>
              Customer
              <input className="ag-input" value={editCustomer} onChange={(e) => setEditCustomer(e.target.value)} />
            </label>

            <label className="ag-label">
              Total
              <input
                className="ag-input"
                type="number"
                value={editTotal}
                onChange={(e) => setEditTotal(e.target.value)}
              />
            </label>

            <div className="ag-muted" style={{ fontSize: 12, marginTop: 6 }}>
              (Later we can add editing items too. For now: customer + total.)
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
              <button className="ag-btn" type="button" onClick={cancelEdit}>
                Cancel
              </button>
              <button className="ag-btn ag-btnPrimary" type="button" onClick={saveEdit}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
