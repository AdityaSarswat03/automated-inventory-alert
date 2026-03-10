import React from "react";

export default function StatusBadge({ quantity, threshold }) {
  let label, className;

  if (quantity === 0) {
    label = "Out of Stock";
    className = "badge badge-red";
  } else if (quantity <= threshold) {
    label = "Low Stock";
    className = "badge badge-yellow";
  } else {
    label = "In Stock";
    className = "badge badge-green";
  }

  return <span className={className}>{label}</span>;
}
