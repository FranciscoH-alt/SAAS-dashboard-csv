from datetime import datetime, date
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, EmailStr


# Auth
class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Uploads
class UploadOut(BaseModel):
    id: int
    filename: str
    status: str
    rows_processed: int
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        orm_mode = True


# Dashboard
class CashflowPoint(BaseModel):
    month: str
    income: float
    expenses: float
    net: float


class DashboardSummary(BaseModel):
    total_income: float
    total_expenses: float
    net: float
    cashflow: List[CashflowPoint]


# Ecommerce analytics
class ColumnSummary(BaseModel):
    name: str
    dtype: str
    non_nulls: int
    sample_values: List[Any]


class UploadProfile(BaseModel):
    columns: List[ColumnSummary]
    row_count: int


class RevenueByPlatform(BaseModel):
    platform: Optional[str]
    net_revenue: float


class ProductRevenue(BaseModel):
    sku: Optional[str]
    product: Optional[str] = None
    net_revenue: float


class DailyRevenue(BaseModel):
    order_date: Optional[date]
    net_revenue: float


class FinancialKpis(BaseModel):
    gross_sales: float
    net_revenue: float
    average_order_value: float
    gross_profit: float
    revenue_by_platform: List[Dict[str, Any]]
    top_products: List[Dict[str, Any]]
    bottom_products: List[Dict[str, Any]]
    revenue_daily: List[Dict[str, Any]]


class StockoutPrediction(BaseModel):
    sku: Optional[str]
    title: Optional[str]
    days_left: float


class InventoryKpis(BaseModel):
    inventory_on_hand: int
    inventory_value: float
    days_of_inventory_on_hand: Optional[float]
    stockout_predictions: List[StockoutPrediction]


class EcommerceAnalysisResult(BaseModel):
    financial_kpis: FinancialKpis
    inventory_kpis: InventoryKpis
    row_counts: Dict[str, int]

