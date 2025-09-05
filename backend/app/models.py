from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Run(Base):
    __tablename__ = "runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)  # UUID as string
    scenario: Mapped[int] = mapped_column(Integer, nullable=False)
    game_id: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="running")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    constraints_json: Mapped[str] = mapped_column(Text, nullable=False)
    attribute_stats_json: Mapped[str] = mapped_column(Text, nullable=False)

    admitted_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rejected_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    capacity_required: Mapped[int] = mapped_column(Integer, default=1000, nullable=False)

    # Pending person cache to persist event attributes on decision
    pending_person_index: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    pending_attributes_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    events: Mapped[list[Event]] = relationship("Event", back_populates="run", cascade="all, delete-orphan")


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(String(36), ForeignKey("runs.id", ondelete="CASCADE"), index=True, nullable=False)
    person_index: Mapped[int] = mapped_column(Integer, nullable=False)
    attributes_json: Mapped[str] = mapped_column(Text, nullable=False)
    accepted: Mapped[bool] = mapped_column(Boolean, nullable=False)
    admitted_count: Mapped[int] = mapped_column(Integer, nullable=False)
    rejected_count: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    run: Mapped[Run] = relationship("Run", back_populates="events")


Index("ix_event_run_person", Event.run_id, Event.person_index)

