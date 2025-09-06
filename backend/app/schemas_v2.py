from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class ProfileResponse(BaseModel):
    guest_id: str
    display_name: str


class UpdateDisplayNameRequest(BaseModel):
    display_name: str


class LeaderboardEntry(BaseModel):
    name: str
    scenarios_completed: int
    total_rejections: int
    last_completion: str
    best_run_id: Optional[str] = None


class LeaderboardResponse(BaseModel):
    entries: list[LeaderboardEntry]
