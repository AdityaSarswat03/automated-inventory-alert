#!/usr/bin/env python3

import time
import schedule
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Product
from app.config import LOW_STOCK_THRESHOLD, CHECK_INTERVAL_MINUTES
from app.report_utils import generate_csv_report


def check_inventory():
    db: Session = SessionLocal()
    try:
        low_stock = (
            db.query(Product)
            .filter(Product.quantity <= Product.low_stock_threshold)
            .all()
        )
        if low_stock:
            print("\n⚠️  LOW STOCK ALERT  ⚠️")
            print("-" * 50)
            for p in low_stock:
                print(f"  {p.name} (SKU: {p.sku}) — {p.quantity} left (threshold: {p.low_stock_threshold})")
            print("-" * 50)

            all_products = db.query(Product).order_by(Product.name).all()
            path = generate_csv_report(all_products)
            print(f"  📄 Report saved → {path}\n")
        else:
            print("✅ All stock levels are healthy.")
    finally:
        db.close()


def main():
    print(f"🔄 Inventory checker started — running every {CHECK_INTERVAL_MINUTES} min(s)")
    check_inventory()
    schedule.every(CHECK_INTERVAL_MINUTES).minutes.do(check_inventory)

    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    main()
