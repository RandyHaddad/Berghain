from __future__ import annotations

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from .db import get_session
from .repo_v2 import get_or_create_profile, update_display_name, get_leaderboard, record_run_completion
from .schemas import ProfileResponse, UpdateDisplayNameRequest, LeaderboardResponse, LeaderboardEntry
from .repo import get_run


router_v2 = APIRouter(prefix="/api", tags=["v2"])


def get_guest_id(request: Request, response: Response) -> str:
    """Get or create guest ID from HTTP-only cookie"""
    guest_id = request.cookies.get("guest_id")
    
    if not guest_id:
        guest_id = str(uuid.uuid4())
        response.set_cookie(
            "guest_id",
            guest_id,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax",
            max_age=30 * 24 * 60 * 60  # 30 days
        )
    
    return guest_id


@router_v2.get("/profile", response_model=ProfileResponse)
async def get_profile(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session)
):
    """Get or create user profile"""
    guest_id = get_guest_id(request, response)
    profile = await get_or_create_profile(session, guest_id)
    
    return ProfileResponse(
        guest_id=profile.guest_id,
        display_name=profile.display_name
    )


@router_v2.post("/profile/name", response_model=ProfileResponse)
async def update_profile_name(
    data: UpdateDisplayNameRequest,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session)
):
    """Update display name"""
    guest_id = get_guest_id(request, response)
    
    try:
        profile = await update_display_name(session, guest_id, data.display_name)
        return ProfileResponse(
            guest_id=profile.guest_id,
            display_name=profile.display_name
        )
    except ValueError as e:
        if "already taken" in str(e):
            raise HTTPException(status_code=409, detail="Display name already taken")
        elif "not found" in str(e):
            raise HTTPException(status_code=404, detail="Profile not found")
        else:
            raise HTTPException(status_code=400, detail=str(e))


@router_v2.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard_data(session: AsyncSession = Depends(get_session)):
    """Get global leaderboard"""
    entries = await get_leaderboard(session)
    return LeaderboardResponse(entries=entries)


@router_v2.post("/runs/{run_id}/complete")
async def complete_run(
    run_id: str,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session)
):
    """Mark a run as completed and record it for leaderboard"""
    guest_id = get_guest_id(request, response)
    
    # Get run details
    run = await get_run(session, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Determine if successful (reached capacity)
    success = run.admitted_count >= run.capacity_required
    
    # Record completion
    await record_run_completion(
        session=session,
        guest_id=guest_id,
        run_id=run_id,
        scenario=run.scenario,
        admitted_count=run.admitted_count,
        rejected_count=run.rejected_count,
        capacity_required=run.capacity_required,
        success=success
    )
    
    return {"status": "completed", "success": success}
