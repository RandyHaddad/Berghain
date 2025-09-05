from __future__ import annotations

import json
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from .config import settings
from .db import get_session
from .locks import get_lock
from .repo import (
    add_event,
    create_run,
    get_last_event,
    get_run,
    list_all_events,
    list_events,
    set_run_pending_person,
    update_run_counts_and_status,
)
from .schemas import (
    AutoStepRequest,
    EventOut,
    ExportResponse,
    AdmittedByAttributeResponse,
    NewRunRequest,
    NextPerson,
    EventsPage,
    RunSummary,
    StepRequest,
    StepResponse,
)
from .service_external import decide_and_next, new_game
from .service_logic import (
    count_admitted_by_attribute,
    decide_accept,
    validate_next_person_index,
)
from .utils import from_json, to_json, utc_iso


router = APIRouter(prefix="/api", tags=["public"])


def _run_to_summary(run) -> RunSummary:
    return RunSummary(
        id=run.id,
        scenario=run.scenario,
        gameId=run.game_id,
        status=run.status,
        admittedCount=run.admitted_count,
        rejectedCount=run.rejected_count,
        capacityRequired=run.capacity_required,
        constraints=json.loads(run.constraints_json),
        attributeStatistics=json.loads(run.attribute_stats_json),
        pendingPersonIndex=run.pending_person_index,
    )


def _event_to_out(ev) -> EventOut:
    return EventOut(
        id=ev.id,
        personIndex=ev.person_index,
        attributes=json.loads(ev.attributes_json),
        accepted=ev.accepted,
        admittedCount=ev.admitted_count,
        rejectedCount=ev.rejected_count,
        createdAt=utc_iso(ev.created_at),
    )


@router.post("/runs/new", response_model=RunSummary)
async def create_new_run(data: NewRunRequest, session: AsyncSession = Depends(get_session)):
    if data.scenario not in (1, 2, 3):
        raise HTTPException(status_code=400, detail="scenario must be 1, 2, or 3")

    ext = await new_game(scenario=data.scenario)
    run_id = str(uuid.uuid4())

    run = await create_run(
        session,
        run_id=run_id,
        scenario=data.scenario,
        game_id=ext["gameId"],
        constraints=ext.get("constraints", []),
        attribute_stats=ext.get("attributeStatistics", {}),
        capacity_required=settings.CAPACITY_REQUIRED,
    )
    return _run_to_summary(run)


@router.get("/runs/{run_id}", response_model=RunSummary)
async def get_run_summary(run_id: str, session: AsyncSession = Depends(get_session)):
    run = await get_run(session, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="run not found")
    return _run_to_summary(run)


@router.get("/runs/{run_id}/events", response_model=EventsPage)
async def get_events(
    run_id: str,
    offset: int = 0,
    limit: int = 200,
    session: AsyncSession = Depends(get_session),
):
    run = await get_run(session, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="run not found")
    items = await list_events(session, run_id, offset=offset, limit=limit)
    return {"items": [_event_to_out(e).model_dump() for e in items], "offset": offset, "limit": limit}


@router.post("/runs/{run_id}/step", response_model=StepResponse)
async def step_run(
    run_id: str,
    data: StepRequest,
    session: AsyncSession = Depends(get_session),
):
    run = await get_run(session, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="run not found")
    lock = await get_lock(run_id)
    async with lock:
        # Validate person index order
        last_event = await get_last_event(session, run_id)
        last_index = last_event.person_index if last_event else None
        validate_next_person_index(last_index, data.personIndex)

        # First fetch only: personIndex == 0 and accept is None
        if data.personIndex == 0 and data.accept is None:
            ext = await decide_and_next(game_id=run.game_id, person_index=0, accept=None)
            if ext.get("status") == "failed":
                await update_run_counts_and_status(
                    session,
                    run,
                    admitted_count=ext.get("admittedCount", 0),
                    rejected_count=ext.get("rejectedCount", 0),
                    status="failed",
                    pending_person_index=None,
                    pending_attributes_json=None,
                )
                raise HTTPException(status_code=502, detail=ext.get("reason", "external failed"))

            next_p = ext.get("nextPerson")
            if not next_p:
                # completed immediately? Unlikely but handle
                run = await update_run_counts_and_status(
                    session,
                    run,
                    admitted_count=ext.get("admittedCount", 0),
                    rejected_count=ext.get("rejectedCount", 0),
                    status=ext.get("status", "completed"),
                    pending_person_index=None,
                    pending_attributes_json=None,
                )
                return StepResponse(run=_run_to_summary(run), event=None, nextPerson=None)

            # Cache pending person
            run = await set_run_pending_person(
                session,
                run,
                pending_person_index=next_p["personIndex"],
                pending_attributes_json=json.dumps(next_p["attributes"]),
            )
            return StepResponse(run=_run_to_summary(run), event=None, nextPerson=NextPerson(**next_p))

        # For decisions (personIndex > 0 or ==0 with accept present)
        if data.accept is None:
            raise HTTPException(status_code=400, detail="accept must be provided for personIndex > 0")

        # Ensure we have cached the attributes for this person
        if run.pending_person_index != data.personIndex or not run.pending_attributes_json:
            raise HTTPException(status_code=409, detail="pending person mismatch or missing")

        # Decide and call external
        ext = await decide_and_next(
            game_id=run.game_id, person_index=data.personIndex, accept=data.accept
        )
        if ext.get("status") == "failed":
            await update_run_counts_and_status(
                session,
                run,
                admitted_count=ext.get("admittedCount", run.admitted_count),
                rejected_count=ext.get("rejectedCount", run.rejected_count),
                status="failed",
                pending_person_index=None,
                pending_attributes_json=None,
            )
            raise HTTPException(status_code=502, detail=ext.get("reason", "external failed"))

        # Persist event for current person
        ev = await add_event(
            session,
            run_id=run_id,
            person_index=data.personIndex,
            attributes_json=run.pending_attributes_json,
            accepted=bool(data.accept),
            admitted_count=int(ext.get("admittedCount", 0)),
            rejected_count=int(ext.get("rejectedCount", 0)),
        )

        # Update run counts and pending next person
        next_p = ext.get("nextPerson")
        run = await update_run_counts_and_status(
            session,
            run,
            admitted_count=int(ext.get("admittedCount", 0)),
            rejected_count=int(ext.get("rejectedCount", 0)),
            status=ext.get("status", run.status),
            pending_person_index=(next_p["personIndex"] if next_p else None),
            pending_attributes_json=(json.dumps(next_p["attributes"]) if next_p else None),
        )

        # Compute updated admitted-by-attribute for convenience
        counts = await count_admitted_by_attribute(session, run_id)
        return StepResponse(
            run=_run_to_summary(run),
            event=_event_to_out(ev),
            nextPerson=(NextPerson(**next_p) if next_p else None),
            admittedByAttribute=counts,
        )


@router.post("/runs/{run_id}/auto-step", response_model=StepResponse)
async def auto_step_run(
    run_id: str,
    data: AutoStepRequest,
    session: AsyncSession = Depends(get_session),
):
    run = await get_run(session, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="run not found")
    lock = await get_lock(run_id)
    async with lock:
        # Validate person index order versus last event
        last_event = await get_last_event(session, run_id)
        last_index = last_event.person_index if last_event else None
        validate_next_person_index(last_index, data.personIndex)

        # If personIndex == 0 and no pending, fetch first person and cache
        if data.personIndex == 0 and run.pending_person_index is None:
            ext = await decide_and_next(game_id=run.game_id, person_index=0, accept=None)
            if ext.get("status") == "failed":
                await update_run_counts_and_status(
                    session,
                    run,
                    admitted_count=ext.get("admittedCount", 0),
                    rejected_count=ext.get("rejectedCount", 0),
                    status="failed",
                    pending_person_index=None,
                    pending_attributes_json=None,
                )
                raise HTTPException(status_code=502, detail=ext.get("reason", "external failed"))
            next_p = ext.get("nextPerson")
            if not next_p:
                run = await update_run_counts_and_status(
                    session,
                    run,
                    admitted_count=ext.get("admittedCount", 0),
                    rejected_count=ext.get("rejectedCount", 0),
                    status=ext.get("status", "completed"),
                    pending_person_index=None,
                    pending_attributes_json=None,
                )
                return StepResponse(run=_run_to_summary(run), event=None, nextPerson=None)
            run = await set_run_pending_person(
                session,
                run,
                pending_person_index=next_p["personIndex"],
                pending_attributes_json=json.dumps(next_p["attributes"]),
            )
            return StepResponse(run=_run_to_summary(run), event=None, nextPerson=NextPerson(**next_p))

        # We must have a pending person for this index
        if run.pending_person_index != data.personIndex or not run.pending_attributes_json:
            raise HTTPException(status_code=409, detail="pending person mismatch or missing")

        # Decide using selected strategy
        constraints = json.loads(run.constraints_json)
        admitted_by_attr = await count_admitted_by_attribute(session, run_id)
        person_attrs = json.loads(run.pending_attributes_json)
        attr_stats = json.loads(run.attribute_stats_json)
        rel_freqs = attr_stats.get("relativeFrequencies", {}) if isinstance(attr_stats, dict) else {}
        strategy = data.strategy or "greedy_tightness"
        accept = decide_accept(
            strategy=strategy,
            person_attributes=person_attrs,
            constraints=constraints,
            admitted_count_by_attr=admitted_by_attr,
            admitted_count=run.admitted_count,
            capacity_required=run.capacity_required,
            relative_frequencies=rel_freqs,
        )

        # Call external with decision
        ext = await decide_and_next(
            game_id=run.game_id, person_index=data.personIndex, accept=accept
        )
        if ext.get("status") == "failed":
            await update_run_counts_and_status(
                session,
                run,
                admitted_count=ext.get("admittedCount", run.admitted_count),
                rejected_count=ext.get("rejectedCount", run.rejected_count),
                status="failed",
                pending_person_index=None,
                pending_attributes_json=None,
            )
            raise HTTPException(status_code=502, detail=ext.get("reason", "external failed"))

        # Persist current event
        ev = await add_event(
            session,
            run_id=run_id,
            person_index=data.personIndex,
            attributes_json=run.pending_attributes_json,
            accepted=bool(accept),
            admitted_count=int(ext.get("admittedCount", 0)),
            rejected_count=int(ext.get("rejectedCount", 0)),
        )

        # Update run and pending
        next_p = ext.get("nextPerson")
        run = await update_run_counts_and_status(
            session,
            run,
            admitted_count=int(ext.get("admittedCount", 0)),
            rejected_count=int(ext.get("rejectedCount", 0)),
            status=ext.get("status", run.status),
            pending_person_index=(next_p["personIndex"] if next_p else None),
            pending_attributes_json=(json.dumps(next_p["attributes"]) if next_p else None),
        )

        # Compute updated admitted-by-attribute for convenience
        counts = await count_admitted_by_attribute(session, run_id)
        return StepResponse(
            run=_run_to_summary(run),
            event=_event_to_out(ev),
            nextPerson=(NextPerson(**next_p) if next_p else None),
            admittedByAttribute=counts,
        )


@router.post("/runs/{run_id}/pause", response_model=RunSummary)
async def pause_run(run_id: str, session: AsyncSession = Depends(get_session)):
    run = await get_run(session, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="run not found")
    run = await update_run_counts_and_status(
        session,
        run,
        admitted_count=run.admitted_count,
        rejected_count=run.rejected_count,
        status="paused",
        pending_person_index=run.pending_person_index,
        pending_attributes_json=run.pending_attributes_json,
    )
    return _run_to_summary(run)


@router.post("/runs/{run_id}/resume", response_model=RunSummary)
async def resume_run(run_id: str, session: AsyncSession = Depends(get_session)):
    run = await get_run(session, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="run not found")
    run = await update_run_counts_and_status(
        session,
        run,
        admitted_count=run.admitted_count,
        rejected_count=run.rejected_count,
        status="running",
        pending_person_index=run.pending_person_index,
        pending_attributes_json=run.pending_attributes_json,
    )
    return _run_to_summary(run)


@router.get("/runs/{run_id}/export", response_model=ExportResponse)
async def export_run(run_id: str, session: AsyncSession = Depends(get_session)):
    run = await get_run(session, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="run not found")
    events = await list_all_events(session, run_id)
    return ExportResponse(
        run=_run_to_summary(run),
        events=[_event_to_out(e) for e in events],
    )


@router.get("/runs/{run_id}/admitted-by-attribute", response_model=AdmittedByAttributeResponse)
async def get_admitted_by_attribute(run_id: str, session: AsyncSession = Depends(get_session)):
    run = await get_run(session, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="run not found")
    counts = await count_admitted_by_attribute(session, run_id)
    return {"counts": counts}
