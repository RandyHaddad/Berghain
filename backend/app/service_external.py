from __future__ import annotations

from typing import Any, Dict, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type

from .config import settings


_client: Optional[httpx.AsyncClient] = None


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(base_url=settings.EXTERNAL_API_BASE, timeout=10.0)
    return _client


@retry(wait=wait_fixed(0.2), stop=stop_after_attempt(3), retry=retry_if_exception_type(httpx.TransportError))
async def new_game(*, scenario: int) -> Dict[str, Any]:
    client = get_client()
    resp = await client.get("/new-game", params={"scenario": scenario, "playerId": settings.PLAYER_ID})
    resp.raise_for_status()
    return resp.json()


@retry(wait=wait_fixed(0.2), stop=stop_after_attempt(3), retry=retry_if_exception_type(httpx.TransportError))
async def decide_and_next(
    *, game_id: str, person_index: int, accept: Optional[bool]
) -> Dict[str, Any]:
    client = get_client()
    params = {"gameId": game_id, "personIndex": person_index}
    if accept is not None:
        params["accept"] = "true" if accept else "false"
    resp = await client.get("/decide-and-next", params=params)
    resp.raise_for_status()
    return resp.json()

