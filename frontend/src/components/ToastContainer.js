import React, { useState, useEffect, useCallback } from "react";
import { fetchAlerts } from "../api";

const POLL_INTERVAL = 30000;
const TOAST_DURATION = 6000;

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const [seenIds, setSeenIds] = useState(() => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem("seen_alert_ids") || "[]"));
    } catch {
      return new Set();
    }
  });

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const checkAlerts = useCallback(async () => {
    try {
      const res = await fetchAlerts();
      const alerts = res.data || [];
      const newAlerts = alerts.filter((a) => !seenIds.has(a.id));
      if (newAlerts.length === 0) return;

      const nextSeen = new Set(seenIds);
      const incoming = newAlerts.map((a) => {
        nextSeen.add(a.id);
        return {
          id: a.id,
          name: a.name,
          sku: a.sku,
          quantity: a.quantity,
          threshold: a.low_stock_threshold,
          type: a.quantity === 0 ? "critical" : "warning",
          ts: Date.now(),
        };
      });

      setSeenIds(nextSeen);
      sessionStorage.setItem("seen_alert_ids", JSON.stringify([...nextSeen]));
      setToasts((prev) => [...incoming, ...prev].slice(0, 8));
    } catch {
    }
  }, [seenIds]);

  useEffect(() => {
    checkAlerts();
    const timer = setInterval(checkAlerts, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [checkAlerts]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(0, -1));
    }, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <div className="toast-icon">
            {t.type === "critical" ? "🔴" : "🟡"}
          </div>
          <div className="toast-body">
            <strong className="toast-title">
              {t.type === "critical" ? "Out of Stock" : "Low Stock"}
            </strong>
            <span className="toast-msg">
              {t.name} ({t.sku}) — {t.quantity} left (threshold: {t.threshold})
            </span>
          </div>
          <button className="toast-close" onClick={() => dismiss(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
