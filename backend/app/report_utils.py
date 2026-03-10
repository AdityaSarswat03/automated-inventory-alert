import csv
import json
import os
from datetime import datetime, timezone
from typing import List

from app.config import REPORTS_DIR
from app.models import Product


def _ensure_reports_dir() -> str:
    os.makedirs(REPORTS_DIR, exist_ok=True)
    return REPORTS_DIR


def _product_to_dict(p: Product) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "sku": p.sku,
        "quantity": p.quantity,
        "price": p.price,
        "low_stock_threshold": p.low_stock_threshold,
        "created_at": str(p.created_at) if p.created_at else "",
        "updated_at": str(p.updated_at) if p.updated_at else "",
    }


def generate_csv_report(products: List[Product]) -> str:
    _ensure_reports_dir()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filepath = os.path.join(REPORTS_DIR, f"stock_report_{timestamp}.csv")

    fieldnames = [
        "id", "name", "sku", "quantity", "price",
        "low_stock_threshold", "created_at", "updated_at",
    ]
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for p in products:
            writer.writerow(_product_to_dict(p))

    return filepath


def generate_json_report(products: List[Product]) -> str:
    _ensure_reports_dir()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filepath = os.path.join(REPORTS_DIR, f"stock_report_{timestamp}.json")

    data = [_product_to_dict(p) for p in products]
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)

    return filepath
