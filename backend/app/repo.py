from __future__ import annotations

import json
from datetime import datetime
from typing import Iterable, List, Optional, Tuple

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Event, Run


async def create_run(
    session: AsyncSession,
    *,
    run_id: str,
    scenario: int,
    game_id: str,
    constraints: list[dict],
    attribute_stats: dict,
    capacity_required: int,
) -> Run:
    run = Run(
        id=run_id,
        scenario=scenario,
        game_id=game_id,
        status="running",
        constraints_json=json.dumps(constraints),
        attribute_stats_json=json.dumps(attribute_stats),
        admitted_count=0,
        rejected_count=0,
        capacity_required=capacity_required,
    )
    session.add(run)
    await session.commit()
    await session.refresh(run)
    return run


async def get_run(session: AsyncSession, run_id: str) -> Optional[Run]:
    return await session.get(Run, run_id)


async def update_run_counts_and_status(
    session: AsyncSession,
    run: Run,
    *,
    admitted_count: int,
    rejected_count: int,
    status: Optional[str] = None,
    pending_person_index: Optional[int] | None = None,
    pending_attributes_json: Optional[str] | None = None,
) -> Run:
    run.admitted_count = admitted_count
    run.rejected_count = rejected_count
    if status is not None:
        run.status = status
    run.pending_person_index = pending_person_index
    run.pending_attributes_json = pending_attributes_json
    run.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(run)
    return run


async def set_run_pending_person(
    session: AsyncSession,
    run: Run,
    *,
    pending_person_index: Optional[int],
    pending_attributes_json: Optional[str],
) -> Run:
    run.pending_person_index = pending_person_index
    run.pending_attributes_json = pending_attributes_json
    run.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(run)
    return run


async def add_event(
    session: AsyncSession,
    *,
    run_id: str,
    person_index: int,
    attributes_json: str,
    accepted: bool,
    admitted_count: int,
    rejected_count: int,
) -> Event:
    ev = Event(
        run_id=run_id,
        person_index=person_index,
        attributes_json=attributes_json,
        accepted=accepted,
        admitted_count=admitted_count,
        rejected_count=rejected_count,
    )
    session.add(ev)
    await session.commit()
    await session.refresh(ev)
    return ev


async def get_last_event(session: AsyncSession, run_id: str) -> Optional[Event]:
    stmt = select(Event).where(Event.run_id == run_id).order_by(desc(Event.person_index)).limit(1)
    res = await session.execute(stmt)
    row = res.scalar_one_or_none()
    return row


async def list_events(
    session: AsyncSession, run_id: str, *, offset: int = 0, limit: int = 200
) -> List[Event]:
    stmt = (
        select(Event)
        .where(Event.run_id == run_id)
        .order_by(Event.person_index)
        .offset(offset)
        .limit(limit)
    )
    res = await session.execute(stmt)
    return list(res.scalars().all())


async def list_all_events(session: AsyncSession, run_id: str) -> List[Event]:
    stmt = select(Event).where(Event.run_id == run_id).order_by(Event.person_index)
    res = await session.execute(stmt)
    return list(res.scalars().all())

