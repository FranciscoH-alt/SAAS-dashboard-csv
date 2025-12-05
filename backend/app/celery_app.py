from celery import Celery
from app.config import settings
from app.database import SessionLocal
from app import models
import pandas as pd
from datetime import datetime

celery_app = Celery(
    "csv_saas",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)


@celery_app.task
def process_upload_task(upload_id: int):
    db = SessionLocal()
    try:
        upload = db.get(models.Upload, upload_id)
        if not upload:
            return

        upload.status = "processing"
        db.commit()

        # Load CSV
        df = pd.read_csv(upload.storage_key)

        # Naive column detection for MVP
        # You’ll improve this later.
        date_col = next((c for c in df.columns if "date" in c.lower()), None)
        amount_col = next((c for c in df.columns if "amount" in c.lower()), None)
        desc_col = next((c for c in df.columns if "desc" in c.lower() or "memo" in c.lower()), None)

        if not date_col or not amount_col:
            upload.status = "failed"
            upload.error_message = "Could not detect date/amount columns"
            db.commit()
            return

        df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
        df = df.dropna(subset=[date_col, amount_col])

        rows = 0
        for _, row in df.iterrows():
            tx = models.Transaction(
                workspace_id=upload.workspace_id,
                source_upload_id=upload.id,
                tx_date=row[date_col].date(),
                amount=row[amount_col],
                description=str(row.get(desc_col, "")) if desc_col else "",
                category=None,
                account_name=None,
                merchant=None,
            )
            db.add(tx)
            rows += 1

        upload.status = "success"
        upload.rows_processed = rows
        upload.completed_at = datetime.utcnow()

        db.commit()
    except Exception as e:
        upload = db.get(models.Upload, upload_id)
        if upload:
            upload.status = "failed"
            upload.error_message = str(e)
            db.commit()
    finally:
        db.close()
