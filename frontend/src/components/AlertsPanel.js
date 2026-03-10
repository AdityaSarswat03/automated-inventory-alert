import React, { useEffect, useState } from "react";
import { fetchAlerts } from "../api";

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      const res = await fetchAlerts();
      setAlerts(res.data);
    } catch {
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const outOfStock = alerts.filter((a) => a.quantity === 0);
  const lowStock = alerts.filter((a) => a.quantity > 0);

  return (
    <>
      <button className="alerts-bell" onClick={() => setOpen(!open)}>
        🔔
        {alerts.length > 0 && (
          <span className="alerts-count">{alerts.length}</span>
        )}
      </button>

      <div className={`alerts-panel ${open ? "open" : ""}`}>
        <div className="alerts-panel-header">
          <h3>Alerts</h3>
          <button className="alerts-close" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>

        {alerts.length === 0 ? (
          <p className="alerts-empty">All stock levels healthy ✅</p>
        ) : (
          <div className="alerts-list">
            {outOfStock.length > 0 && (
              <>
                <h4 className="alerts-section-title red">
                  Out of Stock ({outOfStock.length})
                </h4>
                {outOfStock.map((a) => (
                  <div key={a.id} className="alert-item alert-item-red">
                    <strong>{a.name}</strong>
                    <span className="alert-sku">SKU: {a.sku}</span>
                    <span className="badge badge-red">0 left</span>
                  </div>
                ))}
              </>
            )}

            {lowStock.length > 0 && (
              <>
                <h4 className="alerts-section-title yellow">
                  Low Stock ({lowStock.length})
                </h4>
                {lowStock.map((a) => (
                  <div key={a.id} className="alert-item alert-item-yellow">
                    <strong>{a.name}</strong>
                    <span className="alert-sku">SKU: {a.sku}</span>
                    <span className="badge badge-yellow">
                      {a.quantity} left
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {open && (
        <div className="alerts-overlay" onClick={() => setOpen(false)} />
      )}
    </>
  );
}
