from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile

from .. import schemas
from ..services import ecommerce_analytics

router = APIRouter(tags=["ecommerce"])


@router.post("/upload", response_model=schemas.UploadProfile)
async def upload_profile(file: UploadFile = File(...)):
    """Return a lightweight profile of the uploaded CSV columns."""
    df = ecommerce_analytics.read_csv_upload(file)
    if df.empty:
        raise HTTPException(status_code=422, detail="The uploaded CSV is empty.")

    columns = []
    for col in df.columns:
        series = df[col]
        columns.append(
            schemas.ColumnSummary(
                name=col,
                dtype=str(series.dtype),
                non_nulls=int(series.notnull().sum()),
                sample_values=[val for val in series.dropna().head(5).astype(str)],
            )
        )

    return schemas.UploadProfile(columns=columns, row_count=len(df))


@router.post("/analyze-ecommerce", response_model=schemas.EcommerceAnalysisResult)
async def analyze_ecommerce(files: List[UploadFile] = File(...)):
    """Accept multiple CSVs, normalize them, and return KPI dashboards."""
    if not files:
        raise HTTPException(status_code=400, detail="Please attach at least one CSV file.")

    result = ecommerce_analytics.analyze_ecommerce_files(files)
    return schemas.EcommerceAnalysisResult(**result)
