import React, { useEffect, useState } from "react";
import {
  fetchProducts,
  createProduct,
  updateStock,
  deleteProduct,
  fetchAlerts,
  generateReport,
} from "./api";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [reportMsg, setReportMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    sku: "",
    quantity: 0,
    price: 0,
    low_stock_threshold: 10,
  });

  // ───── Load data ─────
  const loadData = async () => {
    try {
      const [prodRes, alertRes] = await Promise.all([
        fetchProducts(),
        fetchAlerts(),
      ]);
      setProducts(prodRes.data);
      setAlerts(alertRes.data);
    } catch (err) {
      console.error("Failed to load data", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ───── Handlers ─────
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createProduct({
        ...form,
        quantity: Number(form.quantity),
        price: Number(form.price),
        low_stock_threshold: Number(form.low_stock_threshold),
      });
      setForm({ name: "", sku: "", quantity: 0, price: 0, low_stock_threshold: 10 });
      loadData();
    } catch (err) {
      alert("Error creating product: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleStockChange = async (id, newQty) => {
    try {
      await updateStock(id, Number(newQty));
      loadData();
    } catch (err) {
      alert("Error updating stock");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      loadData();
    } catch (err) {
      alert("Error deleting product");
    }
  };

  const handleReport = async (fmt) => {
    try {
      const res = await generateReport(fmt);
      setReportMsg(
        `✅ ${fmt.toUpperCase()} report generated — ${res.data.record_count} records → ${res.data.filename}`
      );
    } catch (err) {
      setReportMsg("❌ Failed to generate report");
    }
  };

  // ───── Render ─────
  return (
    <div className="container">
      <h1>📦 Inventory Alert System</h1>

      {/* ── Alerts ── */}
      {alerts.length > 0 && (
        <div className="alert-box">
          <h2>⚠️ Low Stock Alerts ({alerts.length})</h2>
          <ul>
            {alerts.map((a) => (
              <li key={a.id}>
                <strong>{a.name}</strong> (SKU: {a.sku}) — only{" "}
                <span className="qty-warn">{a.quantity}</span> left (threshold:{" "}
                {a.low_stock_threshold})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Add Product Form ── */}
      <div className="card">
        <h2>Add Product</h2>
        <form onSubmit={handleCreate} className="add-form">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="SKU"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Qty"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            min="0"
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            min="0.01"
            step="0.01"
            required
          />
          <input
            type="number"
            placeholder="Low threshold"
            value={form.low_stock_threshold}
            onChange={(e) =>
              setForm({ ...form, low_stock_threshold: e.target.value })
            }
            min="0"
          />
          <button type="submit">Add</button>
        </form>
      </div>

      {/* ── Reports ── */}
      <div className="card">
        <h2>Generate Report</h2>
        <button onClick={() => handleReport("csv")}>📄 CSV Report</button>{" "}
        <button onClick={() => handleReport("json")}>📄 JSON Report</button>
        {reportMsg && <p className="report-msg">{reportMsg}</p>}
      </div>

      {/* ── Products Table ── */}
      <div className="card">
        <h2>All Products ({products.length})</h2>
        {products.length === 0 ? (
          <p>No products yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Threshold</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className={
                    p.quantity <= p.low_stock_threshold ? "row-warn" : ""
                  }
                >
                  <td>{p.name}</td>
                  <td>{p.sku}</td>
                  <td>
                    <input
                      type="number"
                      defaultValue={p.quantity}
                      min="0"
                      style={{ width: 70 }}
                      onBlur={(e) => handleStockChange(p.id, e.target.value)}
                    />
                  </td>
                  <td>${p.price.toFixed(2)}</td>
                  <td>{p.low_stock_threshold}</td>
                  <td>
                    <button
                      className="btn-del"
                      onClick={() => handleDelete(p.id)}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
