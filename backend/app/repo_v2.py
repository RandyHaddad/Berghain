from __future__ import annotations

import uuid
from typing import Optional, List
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from .models_v2 import Profile, RunCompletion
from .models import Run


async def get_or_create_profile(session: AsyncSession, guest_id: str) -> Profile:
    """Get existing profile or create new one with guest display name"""
    stmt = select(Profile).where(Profile.guest_id == guest_id)
    result = await session.execute(stmt)
    profile = result.scalar_one_or_none()
    
    if not profile:
        # Generate unique guest name
        guest_num = await _get_next_guest_number(session)
        display_name = f"Guest{guest_num:04d}"
        
        profile = Profile(
            guest_id=guest_id,
            display_name=display_name
        )
        session.add(profile)
        await session.commit()
        await session.refresh(profile)
    
    return profile


async def _get_next_guest_number(session: AsyncSession) -> int:
    """Get the next available guest number"""
    stmt = select(func.count(Profile.guest_id))
    result = await session.execute(stmt)
    count = result.scalar() or 0
    return count + 1


async def update_display_name(session: AsyncSession, guest_id: str, new_name: str) -> Profile:
    """Update display name, raise error if name is taken"""
    # Check if name is already taken by another user
    stmt = select(Profile).where(
        and_(Profile.display_name == new_name, Profile.guest_id != guest_id)
    )
    result = await session.execute(stmt)
    existing = result.scalar_one_or_none()
    
    if existing:
        raise ValueError("Display name already taken")
    
    # Update the name
    stmt = select(Profile).where(Profile.guest_id == guest_id)
    result = await session.execute(stmt)
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise ValueError("Profile not found")
    
    profile.display_name = new_name
    await session.commit()
    await session.refresh(profile)
    return profile


async def record_run_completion(
    session: AsyncSession,
    guest_id: str,
    run_id: str,
    scenario: int,
    admitted_count: int,
    rejected_count: int,
    capacity_required: int,
    success: bool
) -> RunCompletion:
    """Record a completed run"""
    completion = RunCompletion(
        guest_id=guest_id,
        run_id=run_id,
        scenario=scenario,
        admitted_count=admitted_count,
        rejected_count=rejected_count,
        capacity_required=capacity_required,
        success=success
    )
    session.add(completion)
    await session.commit()
    await session.refresh(completion)
    return completion


async def get_leaderboard(session: AsyncSession) -> List[dict]:
    """Get global leaderboard data"""
    # Complex query to get leaderboard data
    stmt = """
    WITH completed_scenarios AS (
        SELECT 
            p.guest_id,
            p.display_name,
            COUNT(DISTINCT rc.scenario) as scenarios_completed,
            SUM(rc.rejected_count) as total_rejections,
            MAX(rc.completed_at) as last_completion,
            (
                SELECT rc2.run_id 
                FROM run_completions rc2 
                WHERE rc2.guest_id = p.guest_id 
                ORDER BY rc2.completed_at DESC 
                LIMIT 1
            ) as best_run_id
        FROM profiles p
        JOIN run_completions rc ON p.guest_id = rc.guest_id
        WHERE rc.success = true
        GROUP BY p.guest_id, p.display_name
    )
    SELECT 
        display_name as name,
        scenarios_completed,
        total_rejections,
        last_completion,
        best_run_id
    FROM completed_scenarios
    ORDER BY 
        scenarios_completed DESC,
        total_rejections ASC,
        last_completion DESC
    """
    
    result = await session.execute(stmt)
    rows = result.fetchall()
    
    return [
        {
            "name": row.name,
            "scenarios_completed": row.scenarios_completed,
            "total_rejections": row.total_rejections,
            "last_completion": row.last_completion.isoformat() if row.last_completion else "",
            "best_run_id": row.best_run_id
        }
        for row in rows
    ]
