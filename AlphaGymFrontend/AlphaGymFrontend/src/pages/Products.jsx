import { useEffect, useMemo, useState } from "react";
import "../styles/widgets.css";


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

    const seeded = [
      { id: 1, name: "ALPHA Protein Bar", price: 8, stock: 10, photo: "" },
      { id: 2, name: "ALPHA Water", price: 5, stock: 20, photo: "" },
      { id: 3, name: "ALPHA Day Pass", price: 20, stock: 9999, photo: "" },
    ];
    saveProducts(seeded);
    return seeded;
  });

  const [editProduct, setEditProduct] = useState(null);
  const [epName, setEpName] = useState("");
  const [epPrice, setEpPrice] = useState("");
  const [epFile, setEpFile] = useState(null);


  // ===== Cart
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");

  // ===== Purchase History (transactions)
  const [history, setHistory] = useState(() => loadTransactions());

  // ===== New Product Modal
  const [showNew, setShowNew] = useState(false);
  const [npName, setNpName] = useState("");
  const [npPrice, setNpPrice] = useState("");
  const [npStock, setNpStock] = useState("1");
  const [npFile, setNpFile] = useState(null);

  // ===== 3-dots Product Popup (stock / delete)
  const [menuProduct, setMenuProduct] = useState(null); // product object
  const [stockDelta, setStockDelta] = useState("");

  // ===== Edit Transaction Modal (FULL: customer + items)
  const [editingTx, setEditingTx] = useState(null);
  const [editCustomer, setEditCustomer] = useState("");
  const [editItems, setEditItems] = useState([]); // [{name, qty, price}]

  // Keep history in sync (other pages updates)
  useEffect(() => {
    const refresh = () => setHistory(loadTransactions());
    refresh();
    window.addEventListener("alphagym_sales_updated", refresh);
    return () => window.removeEventListener("alphagym_sales_updated", refresh);
  }, []);

  // Totals
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, x) => sum + Number(x.price || 0) * Number(x.qty || 0), 0);
  }, [cart]);

  const qtyInCart = (productId) => cart.find((x) => x.id === productId)?.qty || 0;

  // ===== Cart handlers (STOCK SAFE)
  const addToCart = (p) => {
    const current = qtyInCart(p.id);
    const stock = Number(p.stock ?? 0);
    if (stock <= 0) return;
    if (current >= stock) return;

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

  const removeFromCart = (id) => setCart((prev) => prev.filter((x) => x.id !== id));
  const clearCart = () => setCart([]);

  // ===== Checkout (reduce stock + save tx)
  const checkout = () => {
    if (!cart.length) return;

    const nextProducts = products.map((p) => {
      const line = cart.find((x) => x.id === p.id);
      if (!line) return p;
      const stock = Number(p.stock ?? 0);
      const newStock = Math.max(0, stock - Number(line.qty || 0));
      return { ...p, stock: newStock };
    });

    setProducts(nextProducts);
    saveProducts(nextProducts);

    const tx = {
      id: Date.now(),
      customer: customerName.trim() || "Walk-in",
      total: cartTotal,
      timeISO: new Date().toISOString(),
      items: cart.map((x) => ({
        name: x.name,
        qty: Number(x.qty || 0),
        price: Number(x.price || 0),
      })),
    };

    addTransaction(tx);
    setHistory(loadTransactions());

    setCustomerName("");
    clearCart();
  };

  // ===== New product create
  const createProduct = async () => {
    const name = npName.trim();
    const price = Number(npPrice);
    const stock = Number(npStock);

    if (!name || !Number.isFinite(price) || price <= 0) return;
    if (!Number.isFinite(stock) || stock < 0) return;

    let photo = "";
    if (npFile) {
      try {
        photo = await fileToDataUrl(npFile);
      } catch {
        photo = "";
      }
    }

    const next = [{ id: Date.now(), name, price, stock, photo }, ...products];
    setProducts(next);
    saveProducts(next);

    setNpName("");
    setNpPrice("");
    setNpStock("1");
    setNpFile(null);
    setShowNew(false);
  };

  // ===== Product 3-dots popup actions
  const applyStockChange = () => {
    if (!menuProduct) return;
    const delta = Number(stockDelta);
    if (!Number.isFinite(delta)) return;

    const next = products.map((p) => {
      if (p.id !== menuProduct.id) return p;
      const updated = Math.max(0, Number(p.stock ?? 0) + delta);
      return { ...p, stock: updated };
    });

    setProducts(next);
    saveProducts(next);

    setStockDelta("");
    setMenuProduct(null);
  };

  const deleteProduct = () => {
    if (!menuProduct) return;

    // remove from products
    const next = products.filter((p) => p.id !== menuProduct.id);
    setProducts(next);
    saveProducts(next);

    // remove from cart too (if exists)
    setCart((prev) => prev.filter((x) => x.id !== menuProduct.id));

    setMenuProduct(null);
    setStockDelta("");
  };

  // ===== Transaction editing (FULL items)
  const startEditTx = (tx) => {
    setEditingTx(tx);
    setEditCustomer(tx.customer || "");
    const items = Array.isArray(tx.items) ? tx.items : [];
    setEditItems(items.map((it) => ({ name: it.name || "", qty: Number(it.qty || 1), price: Number(it.price || 0) })));
  };

  const recalcTotalFromItems = (items) => {
    return items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.qty || 0), 0);
  };

  const saveEditTx = () => {
    if (!editingTx) return;

    const cleanedItems = editItems
      .map((it) => ({
        name: String(it.name || "").trim(),
        qty: Math.max(1, Number(it.qty || 1)),
        price: Math.max(0, Number(it.price || 0)),
      }))
      .filter((it) => it.name.length > 0);

    const newTotal = recalcTotalFromItems(cleanedItems);

    updateTransaction(editingTx.id, {
      customer: editCustomer.trim() || "Walk-in",
      items: cleanedItems,
      total: newTotal,
    });

    setHistory(loadTransactions());
    setEditingTx(null);
  };

  const cancelEditTx = () => setEditingTx(null);

  const updateEditItem = (idx, patch) => {
    setEditItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeEditItem = (idx) => {
    setEditItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addEditItem = () => {
    setEditItems((prev) => [...prev, { name: "", qty: 1, price: 0 }]);
  };

  return (
    <div>
      <h2 className="ag-sectionTitle">Products</h2>
      <div className="ag-muted" style={{ fontSize: 12, marginBottom: 10 }}>
        Add products, then add to cart and checkout.
      </div>

      {/* TOP ACTIONS */}
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

            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 12 }}>
              {products.map((p) => {
                const stock = Number(p.stock ?? 0);
                const inCart = qtyInCart(p.id);
                const out = stock <= 0;

                return (
                  <div
                    key={p.id}
                    style={{
                      width: "min(220px, 100%)",
                      flex: "0 0 220px",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 14,
                      background: "rgba(10,12,16,0.55)",
                      overflow: "hidden",
                      opacity: out ? 0.75 : 1,
                      position: "relative",
                    }}
                  >
                    {/* Photo */}
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
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      ) : (
                        <div className="ag-muted" style={{ fontSize: 12 }}>
                          No photo
                        </div>
                      )}
                    </div>

                    <div style={{ padding: 12 }}>
                      {/* name + 3 dots */}
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                        <div style={{ fontWeight: 800, flex: 1 }}>{p.name}</div>

                        <button
                          className="ag-btn"
                          type="button"
                          title="Options"
                          style={{ padding: "0 10px", height: 34 }}
                          onClick={() => {
                            setMenuProduct(p);
                            setStockDelta("");
                          }}
                        >
                          ⋮
                        </button>
                      </div>

                      <div className="ag-muted" style={{ marginTop: 6, fontSize: 12 }}>
                        {money(p.price)}
                      </div>

                      {/* Stock line */}
                      <div style={{ marginTop: 6, fontSize: 12 }}>
                        {out ? (
                          <span style={{ color: "rgba(255,122,24,0.95)", fontWeight: 900 }}>
                            Out of Stock
                          </span>
                        ) : (
                          <span className="ag-muted">
                            Stock:{" "}
                            <b style={{ color: "rgba(232,236,255,0.95)" }}>{stock - inCart}</b>
                          </span>
                        )}
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <button
                          className="ag-btn ag-btnPrimary"
                          type="button"
                          disabled={out || inCart >= stock}
                          onClick={() => addToCart(p)}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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

                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="ag-btn" type="button" onClick={() => minusQty(x.id)} title="Minus">
                        −
                      </button>
                      <button
                        className="ag-btn"
                        type="button"
                        onClick={() => {
                          const prod = products.find((p) => p.id === x.id);
                          if (prod) addToCart(prod);
                        }}
                        title="Plus"
                      >
                        +
                      </button>
                      <button className="ag-btn" type="button" onClick={() => removeFromCart(x.id)} title="Remove item">
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
                    <th style={{ width: 140 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((tx) => {
                    const dt = new Date(tx.timeISO);
                    const itemsText = (tx.items || []).map((it) => `${it.name} x${it.qty} (₪${it.price})`).join(", ");

                    return (
                      <tr key={tx.id}>
                        <td>{tx.customer || "Walk-in"}</td>
                        <td>{money(tx.total)}</td>
                        <td>{dt.toLocaleString()}</td>
                        <td style={{ maxWidth: 680 }}>{itemsText}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button className="ag-btn" type="button" onClick={() => startEditTx(tx)} title="Edit items">
                            ✏️
                          </button>
                          <button
                            className="ag-btn"
                            type="button"
                            onClick={() => {
                              removeTransaction(tx.id);
                              setHistory(loadTransactions());
                            }}
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

      {/* 3 DOTS PRODUCT POPUP */}
      {menuProduct && (
        <div
          onClick={() => setMenuProduct(null)}
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
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(520px, 94vw)",
              border: "1px solid rgba(255,122,24,0.25)",
              background: "rgba(18,18,20,0.96)",
            }}
          >
            <div style={{ fontWeight: 900, letterSpacing: "0.06em" }}>
              {menuProduct.name} • Options
            </div>

            <div className="ag-muted" style={{ fontSize: 12, marginTop: 6 }}>
              Stock: <b style={{ color: "rgba(232,236,255,0.95)" }}>{Number(menuProduct.stock ?? 0)}</b>
            </div>

            <label className="ag-label" style={{ marginTop: 12 }}>
              Add / Remove Stock (type +5 or -2)
              <input
                className="ag-input"
                type="number"
                placeholder="+5 or -2"
                value={stockDelta}
                onChange={(e) => setStockDelta(e.target.value)}
              />
            </label>

            <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "space-between" }}>
              <button className="ag-btn" type="button" onClick={() => setMenuProduct(null)}>
                Close
              </button>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="ag-btn ag-btnPrimary" type="button" onClick={applyStockChange}>
                  Apply Stock
                </button>

                <button
                  className="ag-btn"
                  type="button"
                  onClick={deleteProduct}
                  style={{ borderColor: "rgba(255,122,24,0.45)" }}
                  title="Delete product"
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <input className="ag-input" type="number" value={npPrice} onChange={(e) => setNpPrice(e.target.value)} />
            </label>

            <label className="ag-label">
              Stock
              <input className="ag-input" type="number" value={npStock} onChange={(e) => setNpStock(e.target.value)} />
            </label>

            <label className="ag-label">
              Photo
              <input className="ag-input" type="file" accept="image/*" onChange={(e) => setNpFile(e.target.files?.[0] || null)} />
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

      {/* Edit Transaction Modal (EDIT ITEMS + PRICE) */}
      {editingTx && (
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
              width: "min(720px, 94vw)",
              border: "1px solid rgba(255,122,24,0.25)",
              background: "rgba(18,18,20,0.96)",
            }}
          >
            <div style={{ fontWeight: 900, letterSpacing: "0.06em" }}>Edit Purchase</div>

            <label className="ag-label" style={{ marginTop: 12 }}>
              Customer
              <input className="ag-input" value={editCustomer} onChange={(e) => setEditCustomer(e.target.value)} />
            </label>

            <div style={{ marginTop: 12, fontWeight: 800 }}>Items</div>
            <div className="ag-muted" style={{ fontSize: 12, marginTop: 4 }}>
              Edit name / qty / price. Total will recalc automatically.
            </div>

            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
              {editItems.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 90px 110px 60px",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <input
                    className="ag-input"
                    placeholder="Item name"
                    value={it.name}
                    onChange={(e) => updateEditItem(idx, { name: e.target.value })}
                  />
                  <input
                    className="ag-input"
                    type="number"
                    min="1"
                    value={it.qty}
                    onChange={(e) => updateEditItem(idx, { qty: e.target.value })}
                  />
                  <input
                    className="ag-input"
                    type="number"
                    min="0"
                    value={it.price}
                    onChange={(e) => updateEditItem(idx, { price: e.target.value })}
                  />
                  <button className="ag-btn" type="button" onClick={() => removeEditItem(idx)} title="Remove item">
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <button className="ag-btn ag-btnPrimary" type="button" onClick={addEditItem}>
                + Add Item
              </button>
            </div>

            <div style={{ marginTop: 14, fontWeight: 900 }}>
              New Total: {money(recalcTotalFromItems(editItems))}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
              <button className="ag-btn" type="button" onClick={cancelEditTx}>
                Cancel
              </button>
              <button className="ag-btn ag-btnPrimary" type="button" onClick={saveEditTx}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
