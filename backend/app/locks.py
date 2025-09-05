import asyncio
from typing import Dict

_locks: Dict[str, asyncio.Lock] = {}
_global_lock = asyncio.Lock()


async def get_lock(run_id: str) -> asyncio.Lock:
    # Double-checked locking
    lock = _locks.get(run_id)
    if lock is None:
        async with _global_lock:
            if run_id not in _locks:
                _locks[run_id] = asyncio.Lock()
            lock = _locks[run_id]
    return lock

