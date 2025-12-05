from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Numeric,
    Text,
    Date,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    workspaces = relationship("WorkspaceUser", back_populates="user")


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    plan_tier = Column(String, default="free")
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("WorkspaceUser", back_populates="workspace")
    uploads = relationship("Upload", back_populates="workspace")
    transactions = relationship("Transaction", back_populates="workspace")


class WorkspaceUser(Base):
    __tablename__ = "workspace_users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    role = Column(String, default="owner")

    user = relationship("User", back_populates="workspaces")
    workspace = relationship("Workspace", back_populates="users")


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    filename = Column(String, nullable=False)
    storage_key = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, processing, success, failed
    error_message = Column(Text, nullable=True)
    rows_processed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    workspace = relationship("Workspace", back_populates="uploads")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    source_upload_id = Column(Integer, ForeignKey("uploads.id"))

    tx_date = Column(Date, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    currency = Column(String, default="USD")
    description = Column(Text)
    category = Column(String)
    account_name = Column(String)
    merchant = Column(String)

    workspace = relationship("Workspace", back_populates="transactions")
