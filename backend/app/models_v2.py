from __future__ import annotations

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float
from sqlalchemy.sql import func
from .db import Base


class Profile(Base):
    __tablename__ = "profiles"
    
    guest_id = Column(String, primary_key=True)
    display_name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class RunCompletion(Base):
    __tablename__ = "run_completions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    guest_id = Column(String, nullable=False)
    run_id = Column(String, nullable=False)
    scenario = Column(Integer, nullable=False)
    completed_at = Column(DateTime, server_default=func.now())
    admitted_count = Column(Integer, nullable=False)
    rejected_count = Column(Integer, nullable=False)
    capacity_required = Column(Integer, nullable=False)
    success = Column(Boolean, nullable=False)  # True if capacity reached, False if failed
