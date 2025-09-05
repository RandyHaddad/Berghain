import json
from datetime import datetime
from typing import Any, Dict


def to_json(data: Any) -> str:
    return json.dumps(data, separators=(",", ":"))


def from_json(text: str | None) -> Any:
    if text is None:
        return None
    return json.loads(text)


def utc_iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat() + "Z"

