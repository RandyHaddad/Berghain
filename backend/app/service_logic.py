from __future__ import annotations

import math
import json
from typing import Dict, List, Optional

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Event, Run
from .utils import from_json


def validate_next_person_index(last_index: Optional[int], incoming_index: int) -> None:
    if last_index is None:
        if incoming_index != 0:
            raise HTTPException(status_code=409, detail="First personIndex must be 0")
    else:
        if incoming_index != last_index + 1:
            raise HTTPException(status_code=409, detail="personIndex must be strictly increasing without gaps")


def decide_accept_greedy(
    *,
    person_attributes: Dict[str, bool],
    constraints: List[Dict],
    admitted_count_by_attr: Dict[str, int],
    admitted_count: int,
    capacity_required: int,
) -> bool:
    remaining_slots = max(0, capacity_required - admitted_count)
    # If nothing remains, we shouldn't be called; return False safe
    if remaining_slots == 0:
        return False

    # Compute deficits and tightness
    deficits: Dict[str, int] = {}
    tightness: Dict[str, float] = {}
    any_deficits = False
    for c in constraints:
        attr = c["attribute"]
        min_count = int(c["minCount"])
        cur = int(admitted_count_by_attr.get(attr, 0))
        deficit = max(0, min_count - cur)
        deficits[attr] = deficit
        if deficit > 0:
            any_deficits = True
        tightness[attr] = (deficit / max(1, remaining_slots)) if remaining_slots > 0 else 0.0

    if not any_deficits:
        # No deficits: accept to fill quickly
        return True

    # Among deficits satisfied by current person, find if any exist
    satisfied_deficits = {a: tightness[a] for a, d in deficits.items() if d > 0 and person_attributes.get(a) is True}
    if not satisfied_deficits:
        return False
    # Choose the highest tightness among satisfied deficits (deterministic accept)
    _ = max(satisfied_deficits.items(), key=lambda kv: (kv[1], kv[0]))
    return True


def _compute_deficits(
    *,
    constraints: List[Dict],
    admitted_count_by_attr: Dict[str, int],
) -> Dict[str, int]:
    deficits: Dict[str, int] = {}
    for c in constraints:
        attr = c["attribute"]
        min_count = int(c["minCount"])
        cur = int(admitted_count_by_attr.get(attr, 0))
        deficits[attr] = max(0, min_count - cur)
    return deficits


def _has_any_deficits(deficits: Dict[str, int]) -> bool:
    return any(d > 0 for d in deficits.values())


def decide_accept_expected_feasible(
    *,
    person_attributes: Dict[str, bool],
    constraints: List[Dict],
    admitted_count_by_attr: Dict[str, int],
    admitted_count: int,
    capacity_required: int,
    relative_frequencies: Dict[str, float],
) -> bool:
    remaining = max(0, capacity_required - admitted_count)
    if remaining == 0:
        return False
    deficits = _compute_deficits(constraints=constraints, admitted_count_by_attr=admitted_count_by_attr)
    if not _has_any_deficits(deficits):
        return True
    # If satisfies any deficit -> accept
    for attr, deficit in deficits.items():
        if deficit > 0 and person_attributes.get(attr) is True:
            return True
    # Else guard expected feasibility: accepting reduces slots by 1; ensure expected supply still >= deficits
    rem_after = remaining - 1
    for attr, deficit in deficits.items():
        if deficit <= 0:
            continue
        if person_attributes.get(attr) is True:
            continue
        p = float(relative_frequencies.get(attr, 0.0))
        expected_supply = p * rem_after
        if expected_supply < deficit - 1e-9:
            return False
    return True


def decide_accept_risk_adjusted_feasible(
    *,
    person_attributes: Dict[str, bool],
    constraints: List[Dict],
    admitted_count_by_attr: Dict[str, int],
    admitted_count: int,
    capacity_required: int,
    relative_frequencies: Dict[str, float],
    z: float = 1.0,
) -> bool:
    remaining = max(0, capacity_required - admitted_count)
    if remaining == 0:
        return False
    deficits = _compute_deficits(constraints=constraints, admitted_count_by_attr=admitted_count_by_attr)
    if not _has_any_deficits(deficits):
        return True
    for attr, deficit in deficits.items():
        if deficit > 0 and person_attributes.get(attr) is True:
            return True
    # Risk-adjusted guard: expected - z*std >= deficit for all unsatisfied deficits
    rem_after = remaining - 1
    for attr, deficit in deficits.items():
        if deficit <= 0 or person_attributes.get(attr) is True:
            continue
        p = float(relative_frequencies.get(attr, 0.0))
        n = rem_after
        expected = p * n
        std = math.sqrt(max(0.0, n * p * (1 - p)))
        if expected - z * std < deficit - 1e-9:
            return False
    return True


def decide_accept_proportional_control(
    *,
    person_attributes: Dict[str, bool],
    constraints: List[Dict],
    admitted_count_by_attr: Dict[str, int],
    admitted_count: int,
    capacity_required: int,
) -> bool:
    remaining = max(0, capacity_required - admitted_count)
    if remaining == 0:
        return False
    deficits = _compute_deficits(constraints=constraints, admitted_count_by_attr=admitted_count_by_attr)
    if not _has_any_deficits(deficits):
        return True
    # Compute proportional need vs current admitted proportions
    denom = max(1, admitted_count)
    score = 0.0
    for c in constraints:
        attr = c["attribute"]
        target_prop = (c["minCount"]) / max(1, capacity_required)
        cur_prop = admitted_count_by_attr.get(attr, 0) / denom
        need = max(0.0, target_prop - cur_prop)
        if person_attributes.get(attr) is True:
            score += need
    if score > 0:
        return True
    return False


def decide_accept_lookahead_1(
    *,
    person_attributes: Dict[str, bool],
    constraints: List[Dict],
    admitted_count_by_attr: Dict[str, int],
    admitted_count: int,
    capacity_required: int,
    relative_frequencies: Dict[str, float],
) -> bool:
    remaining = max(0, capacity_required - admitted_count)
    if remaining == 0:
        return False
    deficits = _compute_deficits(constraints=constraints, admitted_count_by_attr=admitted_count_by_attr)
    if not _has_any_deficits(deficits):
        return True

    def branch_min_slack(accept: bool) -> float:
        rem = remaining - (1 if accept else 0)
        # Adjust deficits if accepting and person satisfies attrs
        adj_deficits: Dict[str, int] = dict(deficits)
        if accept:
            for attr in adj_deficits:
                if person_attributes.get(attr) is True and adj_deficits[attr] > 0:
                    adj_deficits[attr] -= 1
        # Min slack = min over attrs of expected_supply - deficit
        best = float("inf")
        for attr, deficit in adj_deficits.items():
            if deficit <= 0:
                continue
            p = float(relative_frequencies.get(attr, 0.0))
            exp_supply = p * rem
            slack = exp_supply - deficit
            if slack < best:
                best = slack
        if best is float("inf"):
            return 1e9
        return best

    s_accept = branch_min_slack(True)
    s_reject = branch_min_slack(False)
    if s_accept > s_reject + 1e-9:
        return True
    if s_reject > s_accept + 1e-9:
        return False
    # Tie-break: accept if helps any deficit
    for attr, deficit in deficits.items():
        if deficit > 0 and person_attributes.get(attr) is True:
            return True
    return False


def decide_accept(
    *,
    strategy: str,
    person_attributes: Dict[str, bool],
    constraints: List[Dict],
    admitted_count_by_attr: Dict[str, int],
    admitted_count: int,
    capacity_required: int,
    relative_frequencies: Dict[str, float] | None = None,
) -> bool:
    st = strategy.lower().replace("-", "_") if strategy else "greedy_tightness"
    if st == "greedy_tightness":
        return decide_accept_greedy(
            person_attributes=person_attributes,
            constraints=constraints,
            admitted_count_by_attr=admitted_count_by_attr,
            admitted_count=admitted_count,
            capacity_required=capacity_required,
        )
    if st == "expected_feasible":
        return decide_accept_expected_feasible(
            person_attributes=person_attributes,
            constraints=constraints,
            admitted_count_by_attr=admitted_count_by_attr,
            admitted_count=admitted_count,
            capacity_required=capacity_required,
            relative_frequencies=relative_frequencies or {},
        )
    if st == "risk_adjusted_feasible":
        return decide_accept_risk_adjusted_feasible(
            person_attributes=person_attributes,
            constraints=constraints,
            admitted_count_by_attr=admitted_count_by_attr,
            admitted_count=admitted_count,
            capacity_required=capacity_required,
            relative_frequencies=relative_frequencies or {},
            z=1.0,
        )
    if st == "proportional_control":
        return decide_accept_proportional_control(
            person_attributes=person_attributes,
            constraints=constraints,
            admitted_count_by_attr=admitted_count_by_attr,
            admitted_count=admitted_count,
            capacity_required=capacity_required,
        )
    if st == "lookahead_1":
        return decide_accept_lookahead_1(
            person_attributes=person_attributes,
            constraints=constraints,
            admitted_count_by_attr=admitted_count_by_attr,
            admitted_count=admitted_count,
            capacity_required=capacity_required,
            relative_frequencies=relative_frequencies or {},
        )
    # Fallback
    return decide_accept_greedy(
        person_attributes=person_attributes,
        constraints=constraints,
        admitted_count_by_attr=admitted_count_by_attr,
        admitted_count=admitted_count,
        capacity_required=capacity_required,
    )


async def count_admitted_by_attribute(session: AsyncSession, run_id: str) -> Dict[str, int]:
    # Fetch accepted events and aggregate attribute True counts
    from sqlalchemy import select
    from .models import Event

    stmt = select(Event).where(Event.run_id == run_id, Event.accepted == True)  # noqa: E712
    res = await session.execute(stmt)
    counts: Dict[str, int] = {}
    for ev in res.scalars():
        attrs = json.loads(ev.attributes_json)
        for k, v in attrs.items():
            if v is True:
                counts[k] = counts.get(k, 0) + 1
    return counts
