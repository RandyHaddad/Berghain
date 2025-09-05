import pytest
from fastapi import HTTPException

from app.service_logic import validate_next_person_index


def test_first_person_index_must_be_zero():
    with pytest.raises(HTTPException) as ei:
        validate_next_person_index(None, 1)
    assert ei.value.status_code == 409


def test_subsequent_must_increase_by_one():
    validate_next_person_index(0, 1)  # ok
    with pytest.raises(HTTPException) as ei:
        validate_next_person_index(1, 1)
    assert ei.value.status_code == 409
    with pytest.raises(HTTPException) as ei2:
        validate_next_person_index(1, 3)
    assert ei2.value.status_code == 409

