from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, examples=["Widget A"])
    sku: str = Field(..., min_length=1, max_length=100, examples=["WDG-001"])
    quantity: int = Field(..., ge=0, examples=[100])
    price: float = Field(..., gt=0, examples=[9.99])
    low_stock_threshold: int = Field(default=10, ge=0)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    quantity: Optional[int] = Field(None, ge=0)
    price: Optional[float] = Field(None, gt=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)


class StockUpdate(BaseModel):
    quantity: int = Field(..., ge=0, description="New absolute stock quantity")



class ProductResponse(BaseModel):
    id: int
    name: str
    sku: str
    quantity: int
    price: float
    low_stock_threshold: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AlertItem(BaseModel):
    id: int
    name: str
    sku: str
    quantity: int
    low_stock_threshold: int


class ReportMeta(BaseModel):
    filename: str
    format: str
    generated_at: str
    record_count: int


class CSVProductError(BaseModel):
    row: int
    error: str


class CSVUploadResponse(BaseModel):
    total_rows: int
    successful: int
    skipped: int
    errors: List[CSVProductError]
