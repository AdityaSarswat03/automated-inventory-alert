import React, { useEffect, useState } from "react";
import {
  fetchProducts,
  createProduct,
  updateStock,
  deleteProduct,
} from "../api";
import StatusBadge from "../components/StatusBadge";

const EMPTY_FORM = {
  name: "",
  sku: "",
  quantity: 0,
  price: 0,
  low_stock_threshold: 10,
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = async () => {
    try {
      const res = await fetchProducts();
      setProducts(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let list = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    if (statusFilter === "in") {
      list = list.filter((p) => p.quantity > p.low_stock_threshold);
    } else if (statusFilter === "low") {
      list = list.filter(
        (p) => p.quantity > 0 && p.quantity <= p.low_stock_threshold
      );
    } else if (statusFilter === "out") {
      list = list.filter((p) => p.quantity === 0);
    }

    setFiltered(list);
  }, [products, search, statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createProduct({
        ...form,
        quantity: Number(form.quantity),
        price: Number(form.price),
        low_stock_threshold: Number(form.low_stock_threshold),
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      alert(
        "Error: " + (err.response?.data?.detail || err.message)
      );
    }
  };

  const handleStockBlur = async (id, val) => {
    try {
      await updateStock(id, Number(val));
      load();
    } catch {
      alert("Failed to update stock");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      load();
    } catch {
      alert("Failed to delete");
    }
  };

  if (loading) return <div className="page-loader">Loading…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Inventory Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Add Product"}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h2 className="card-title">New Product</h2>
          <form onSubmit={handleCreate} className="inv-form">
            <div className="form-group">
              <label>Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>SKU</label>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Price (₹)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Low-Stock Threshold</label>
              <input
                type="number"
                min="0"
                value={form.low_stock_threshold}
                onChange={(e) =>
                  setForm({ ...form, low_stock_threshold: e.target.value })
                }
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Save Product
            </button>
          </form>
        </div>
      )}

      <div className="card filters-bar">
        <input
          className="search-input"
          placeholder="Search by name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="in">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      <div className="card">
        <h2 className="card-title">
          Products{" "}
          <span className="title-count">({filtered.length})</span>
        </h2>

        {filtered.length === 0 ? (
          <p className="empty-msg">No products match your filters.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="cell-id">{p.id}</td>
                    <td>{p.name}</td>
                    <td className="cell-mono">{p.sku}</td>
                    <td>
                      <input
                        type="number"
                        className="inline-qty"
                        defaultValue={p.quantity}
                        min="0"
                        onBlur={(e) =>
                          handleStockBlur(p.id, e.target.value)
                        }
                      />
                    </td>
                    <td className="cell-num">
                      ₹{p.price.toFixed(2)}
                    </td>
                    <td className="cell-num">{p.low_stock_threshold}</td>
                    <td>
                      <StatusBadge
                        quantity={p.quantity}
                        threshold={p.low_stock_threshold}
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(p.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
