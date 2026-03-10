import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const links = [
    { to: "/", icon: "📊", label: "Dashboard" },
    { to: "/inventory", icon: "📦", label: "Inventory" },
    { to: "/reports", icon: "📄", label: "Reports" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">⚡</span>
        <span className="brand-text">InvAlert</span>
      </div>

      <nav className="sidebar-nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-link-icon">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">Inventory Alert v1.0</div>
    </aside>
  );
}
