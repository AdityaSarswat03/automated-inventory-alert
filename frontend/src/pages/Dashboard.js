import React, { useEffect, useState } from "react";
import { fetchProducts } from "../api";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchProducts();
        setProducts(res.data);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalProducts = products.length;
  const lowStockItems = products.filter(
    (p) => p.quantity > 0 && p.quantity <= p.low_stock_threshold
  ).length;
  const outOfStockItems = products.filter((p) => p.quantity === 0).length;
  const totalValue = products.reduce(
    (sum, p) => sum + p.quantity * p.price,
    0
  );

  const cards = [
    { label: "Total Products", value: totalProducts, icon: "📦", color: "#6366f1" },
    { label: "Low Stock", value: lowStockItems, icon: "⚠️", color: "#f59e0b" },
    { label: "Out of Stock", value: outOfStockItems, icon: "🚫", color: "#ef4444" },
    {
      label: "Inventory Value",
      value: `₹${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: "💰",
      color: "#10b981",
    },
  ];

  if (loading) return <div className="page-loader">Loading…</div>;

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>

      <div className="summary-cards">
        {cards.map((c) => (
          <div key={c.label} className="summary-card" style={{ borderTopColor: c.color }}>
            <div className="card-icon">{c.icon}</div>
            <div className="card-info">
              <span className="card-value">{c.value}</span>
              <span className="card-label">{c.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="card-title">Stock Status Overview</h2>
        {products.length === 0 ? (
          <p className="empty-msg">No products in inventory yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="cell-id">{p.id}</td>
                    <td>{p.name}</td>
                    <td className="cell-mono">{p.sku}</td>
                    <td className="cell-num">{p.quantity}</td>
                    <td className="cell-num">{p.low_stock_threshold}</td>
                    <td>
                      <StatusBadge
                        quantity={p.quantity}
                        threshold={p.low_stock_threshold}
                      />
                    </td>
                    <td className="cell-date">
                      {p.updated_at
                        ? new Date(p.updated_at).toLocaleDateString()
                        : "—"}
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
