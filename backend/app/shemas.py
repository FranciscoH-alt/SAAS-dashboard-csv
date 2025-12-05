from datetime import datetime, date
from typing import Optional, List
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
