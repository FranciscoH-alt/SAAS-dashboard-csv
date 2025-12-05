import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..deps import get_current_user, get_current_workspace
from ...celery_app import process_upload_task  # we'll define this shortly

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = "/data/uploads"  # mounted volume in docker


@router.post("/", response_model=schemas.UploadOut)
async def create_upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    workspace: models.Workspace = Depends(get_current_workspace),
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename)[1]
    key = f"{workspace.id}/{uuid.uuid4()}{ext}"
    path = os.path.join(UPLOAD_DIR, key.replace("/", "_"))

    with open(path, "wb") as f:
        content = await file.read()
        f.write(content)

    upload = models.Upload(
        workspace_id=workspace.id,
        filename=file.filename,
        storage_key=path,
        status="pending",
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    # Trigger background processing
    process_upload_task.delay(upload.id)

    return upload


@router.get("/", response_model=list[schemas.UploadOut])
def list_uploads(
    db: Session = Depends(get_db),
    workspace: models.Workspace = Depends(get_current_workspace),
):
    uploads = db.query(models.Upload).filter(models.Upload.workspace_id == workspace.id).order_by(models.Upload.created_at.desc()).all()
    return uploads
