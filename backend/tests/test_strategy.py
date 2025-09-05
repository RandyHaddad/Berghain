import pytest

from app.service_logic import (
    decide_accept_greedy,
    decide_accept_expected_feasible,
)


def test_accept_when_no_deficits():
    attrs = {"berlin": False}
    constraints = [{"attribute": "berlin", "minCount": 0}]
    counts = {"berlin": 0}
    assert decide_accept_greedy(
        person_attributes=attrs,
        constraints=constraints,
        admitted_count_by_attr=counts,
        admitted_count=10,
        capacity_required=1000,
    )


def test_reject_when_does_not_help_deficit():
    attrs = {"berlin": False}
    constraints = [{"attribute": "berlin", "minCount": 400}]
    counts = {"berlin": 100}
    # remaining 900 slots, deficit 300
    assert not decide_accept_greedy(
        person_attributes=attrs,
        constraints=constraints,
        admitted_count_by_attr=counts,
        admitted_count=100,
        capacity_required=1000,
    )


def test_accept_when_helps_any_deficit():
    attrs = {"berlin": True, "black": False}
    constraints = [
        {"attribute": "berlin", "minCount": 400},
        {"attribute": "black", "minCount": 800},
    ]
    counts = {"berlin": 350, "black": 790}
    # berlin deficit 50, black deficit 10
    assert decide_accept_greedy(
        person_attributes=attrs,
        constraints=constraints,
        admitted_count_by_attr=counts,
        admitted_count=900,
        capacity_required=1000,
    )


def test_accept_choose_highest_satisfied_tightness_but_any_satisfied_is_enough():
    # Person satisfies multiple deficits; strategy accepts
    attrs = {"berlin": True, "black": True}
    constraints = [
        {"attribute": "berlin", "minCount": 400},
        {"attribute": "black", "minCount": 800},
    ]
    counts = {"berlin": 350, "black": 790}
    assert decide_accept_greedy(
        person_attributes=attrs,
        constraints=constraints,
        admitted_count_by_attr=counts,
        admitted_count=900,
        capacity_required=1000,
    )


def test_expected_feasible_guard_rejects_when_accept_would_break_expectation():
    # capacity 10, admitted 8, remaining 2; need black min 9; current black 8
    # person is not black; freq black = 0.4 -> after accepting, remaining 1, expected 0.4 < deficit 1 -> reject
    attrs = {"black": False}
    constraints = [{"attribute": "black", "minCount": 9}]
    counts = {"black": 8}
    rel = {"black": 0.4}
    accept = decide_accept_expected_feasible(
        person_attributes=attrs,
        constraints=constraints,
        admitted_count_by_attr=counts,
        admitted_count=8,
        capacity_required=10,
        relative_frequencies=rel,
    )
    assert accept is False
