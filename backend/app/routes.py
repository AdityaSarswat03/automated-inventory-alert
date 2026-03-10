from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from app.database import get_db
from app.models import Product
from app.schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    StockUpdate,
    AlertItem,
    ReportMeta,
)
from app.report_utils import generate_csv_report, generate_json_report

router = APIRouter()


@router.get("/products", response_model=List[ProductResponse], tags=["Products"])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.name).all()


@router.get("/products/{product_id}", response_model=ProductResponse, tags=["Products"])
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/products", response_model=ProductResponse, status_code=201, tags=["Products"])
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/products/{product_id}", response_model=ProductResponse, tags=["Products"])
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    product.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/products/{product_id}/stock", response_model=ProductResponse, tags=["Products"])
def update_stock(product_id: int, payload: StockUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.quantity = payload.quantity
    product.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=204, tags=["Products"])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()


@router.get("/alerts", response_model=List[AlertItem], tags=["Alerts"])
def get_low_stock_alerts(db: Session = Depends(get_db)):
    products = (
        db.query(Product)
        .filter(Product.quantity <= Product.low_stock_threshold)
        .order_by(Product.quantity)
        .all()
    )
    return products


@router.post("/reports", response_model=ReportMeta, tags=["Reports"])
def generate_report(
    fmt: str = Query(default="csv", pattern="^(csv|json)$"),
    db: Session = Depends(get_db),
):
    products = db.query(Product).order_by(Product.name).all()

    if fmt == "json":
        filepath = generate_json_report(products)
    else:
        filepath = generate_csv_report(products)

    return ReportMeta(
        filename=filepath,
        format=fmt,
        generated_at=datetime.now(timezone.utc).isoformat(),
        record_count=len(products),
    )
