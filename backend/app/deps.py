from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from .config import settings
from .database import get_db
from . import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> models.User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise credentials_exc

    user = db.get(models.User, user_id)
    if not user:
        raise credentials_exc
    return user


def get_current_workspace(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> models.Workspace:
    # For MVP, just return the first workspace the user belongs to
    link = current_user.workspaces[0] if current_user.workspaces else None
    if not link:
        raise HTTPException(status_code=400, detail="No workspace associated with user")
    return link.workspace
