from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class Constraint(BaseModel):
    attribute: str
    minCount: int


class AttributeStatistics(BaseModel):
    relativeFrequencies: Dict[str, float] = Field(default_factory=dict)
    correlations: Dict[str, Dict[str, float]] = Field(default_factory=dict)


class NewRunRequest(BaseModel):
    scenario: int = Field(ge=1, le=3)


class RunSummary(BaseModel):
    id: str
    scenario: int
    gameId: str
    status: str
    admittedCount: int
    rejectedCount: int
    capacityRequired: int
    constraints: List[Constraint]
    attributeStatistics: AttributeStatistics
    pendingPersonIndex: Optional[int] = None


class NextPerson(BaseModel):
    personIndex: int
    attributes: Dict[str, bool]


class StepRequest(BaseModel):
    personIndex: int
    accept: Optional[bool] = None


class AutoStepRequest(BaseModel):
    personIndex: int
    strategy: str | None = None


class EventOut(BaseModel):
    id: int
    personIndex: int
    attributes: Dict[str, Any]
    accepted: bool
    admittedCount: int
    rejectedCount: int
    createdAt: str


class StepResponse(BaseModel):
    run: RunSummary
    event: Optional[EventOut] = None
    nextPerson: Optional[NextPerson] = None


class EventsPage(BaseModel):
    items: List[EventOut]
    offset: int
    limit: int


class ExportResponse(BaseModel):
    run: RunSummary
    events: List[EventOut]
