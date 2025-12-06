from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import auth, dashboard, ecommerce, uploads
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List

# Import the analyzer function
from app.services.ecommerce_analytics import analyze_ecommerce_files

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(uploads.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(ecommerce.router, prefix=settings.API_V1_STR)
# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Ecommerce Analytics API"}


@app.post("/analyze-ecommerce")
async def analyze_ecommerce(files: List[UploadFile] = File(...)):
    """
    Upload multiple CSV files and get ecommerce KPIs back
    """
    try:
        result = await analyze_ecommerce_files(files)
        return result
    except ValueError as e:
        # Return 400 for no recognizable data
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Return 500 for other errors
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# Alias endpoint for /upload (since your frontend is calling this)
@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Alias for /analyze-ecommerce endpoint
    """
    return await analyze_ecommerce(files)
