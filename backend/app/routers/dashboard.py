from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from .. import models, schemas
from ..deps import get_current_workspace

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=schemas.DashboardSummary)
def get_summary(
    db: Session = Depends(get_db),
    workspace: models.Workspace = Depends(get_current_workspace),
):
    q = db.query(
        func.coalesce(func.sum(models.Transaction.amount), 0)
    ).filter(models.Transaction.workspace_id == workspace.id)

    total_net = q.scalar() or 0

    income = (
        db.query(func.coalesce(func.sum(models.Transaction.amount), 0))
        .filter(models.Transaction.workspace_id == workspace.id, models.Transaction.amount > 0)
        .scalar()
        or 0
    )
    expenses = (
        db.query(func.coalesce(func.sum(models.Transaction.amount), 0))
        .filter(models.Transaction.workspace_id == workspace.id, models.Transaction.amount < 0)
        .scalar()
        or 0
    )
    expenses = float(-expenses)  # make positive

    # Simple monthly aggregation
    rows = (
        db.query(
            func.to_char(models.Transaction.tx_date, "YYYY-MM") as month,
            func.coalesce(func.sum(func.case([(models.Transaction.amount > 0, models.Transaction.amount)], else_=0)), 0).label("income"),
            func.coalesce(func.sum(func.case([(models.Transaction.amount < 0, -models.Transaction.amount)], else_=0)), 0).label("expenses"),
        )
        .filter(models.Transaction.workspace_id == workspace.id)
        .group_by("month")
        .order_by("month")
        .all()
    )

    cashflow = [
        schemas.CashflowPoint(
            month=r.month,
            income=float(r.income),
            expenses=float(r.expenses),
            net=float(r.income - r.expenses),
        )
        for r in rows
    ]

    return schemas.DashboardSummary(
        total_income=float(income),
        total_expenses=float(expenses),
        net=float(total_net),
        cashflow=cashflow,
    )
