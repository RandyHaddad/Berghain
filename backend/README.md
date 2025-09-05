Backend (FastAPI)

Run locally
- Use Python 3.11 (greenlet wheels for 3.13 may be unavailable).
- Create venv and install deps:
  - Windows: `py -3.11 -m venv .venv && .venv\\Scripts\\Activate.ps1`
  - macOS/Linux: `python3.11 -m venv .venv && source .venv/bin/activate`
- `pip install -U pip && pip install -r requirements.txt`
- `uvicorn app.main:app --reload`

Environment
- `PLAYER_ID` – player UUID for external API.
- `EXTERNAL_API_BASE` – default `https://berghain.challenges.listenlabs.ai`.
- `DATABASE_URL` – SQLite URL, e.g. `sqlite:///./data/db.sqlite3` (auto-converted to `sqlite+aiosqlite://` for async engine).
- `CORS_ORIGINS` – comma-separated list (e.g. `http://localhost:5173`).

Design
- Proxies to external API, hides player id, and validates `personIndex` ordering.
- Serializes steps per run using `asyncio.Lock`.
- Persists events and run state; caches the pending person to ensure attribute persistence on decision.
- Implements Greedy-tightness strategy in `service_logic.py` and provides unit tests.

Tests
- `pytest`
