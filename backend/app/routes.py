import os
import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from datetime import datetime, timezone

from app.config import REPORTS_DIR

from app.database import get_db
from app.models import Product
from app.schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    StockUpdate,
    AlertItem,
    ReportMeta,
    CSVUploadResponse,
    CSVProductError,
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


@router.post("/products/upload-csv", response_model=CSVUploadResponse, tags=["Products"])
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Validate file extension
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    # Read file content
    content = await file.read()
    try:
        text_content = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded")
    
    # Parse CSV
    csv_reader = csv.DictReader(io.StringIO(text_content))
    
    # Validate required columns
    required_columns = {"name", "sku", "quantity", "price"}
    if not required_columns.issubset(set(csv_reader.fieldnames or [])):
        raise HTTPException(
            status_code=400, 
            detail=f"CSV must contain columns: {', '.join(required_columns)}"
        )
    
    errors = []
    successful = 0
    total_rows = 0
    
    for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 (header is row 1)
        total_rows += 1
        
        try:
            # Parse and validate data
            product_data = {
                "name": row["name"].strip(),
                "sku": row["sku"].strip(),
                "quantity": int(row["quantity"]),
                "price": float(row["price"]),
                "low_stock_threshold": int(row.get("low_stock_threshold", 10))
            }
            
            # Validate using Pydantic schema
            product_create = ProductCreate(**product_data)
            
            # Create product in database
            product = Product(**product_create.model_dump())
            db.add(product)
            db.commit()
            db.refresh(product)
            successful += 1
            
        except ValueError as e:
            errors.append(CSVProductError(
                row=row_num,
                error=f"Invalid data format: {str(e)}"
            ))
            db.rollback()
        except IntegrityError as e:
            errors.append(CSVProductError(
                row=row_num,
                error=f"Duplicate SKU or name: {row.get('sku', 'N/A')}"
            ))
            db.rollback()
        except Exception as e:
            errors.append(CSVProductError(
                row=row_num,
                error=str(e)
            ))
            db.rollback()
    
    return CSVUploadResponse(
        total_rows=total_rows,
        successful=successful,
        skipped=len(errors),
        errors=errors
    )


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
        filename=os.path.basename(filepath),
        format=fmt,
        generated_at=datetime.now(timezone.utc).isoformat(),
        record_count=len(products),
    )


@router.get("/reports/download/{filename}", tags=["Reports"])
def download_report(filename: str):
    filepath = os.path.join(REPORTS_DIR, filename)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="Report file not found")
    media = "text/csv" if filename.endswith(".csv") else "application/json"
    return FileResponse(filepath, media_type=media, filename=filename)
