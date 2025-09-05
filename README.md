Berghain Challenge – Monorepo

Single repo with a FastAPI backend and a Vite + React frontend for playing and optimizing the Berghain Challenge via a Greedy-tightness strategy. Minimal, production-ready defaults with Render (backend) and Vercel (frontend).

Quick Start
- Requires Python 3.11 (greenlet wheels not available on 3.13 yet).
- Frontend env: `cp frontend/.env.example frontend/.env` then set `VITE_API_BASE_URL=http://localhost:8000/api`.
- Backend env (optional): `cp .env.example .env` and update vars as needed.
- Terminal 1 (backend):
  - `cd backend`
  - `py -3.11 -m venv .venv && .venv\\Scripts\\Activate.ps1` (Windows) or `python3.11 -m venv .venv && source .venv/bin/activate` (macOS/Linux)
  - `pip install -U pip`
  - `pip install -r requirements.txt`
  - `uvicorn app.main:app --reload`
- Terminal 2 (frontend):
  - `cd frontend`
  - `npm i`
  - `npm run dev`

Backend Overview
- Tech: FastAPI (Python 3.11), SQLAlchemy (SQLite + aiosqlite), httpx, tenacity.
- Endpoints (prefix `/api`):
  - `POST /runs/new` -> create and persist a run by proxying external `/new-game`.
  - `GET /runs/:runId` -> run summary + latest state.
  - `GET /runs/:runId/events?offset&limit` -> paginated ordered events.
  - `POST /runs/:runId/step` -> manual step with `{ personIndex, accept? }`; persists event and updates state.
  - `POST /runs/:runId/auto-step` -> backend applies Greedy-tightness and steps.
  - `POST /runs/:runId/pause|resume` -> set status.
  - `GET /runs/:runId/export` -> `{ run, events[] }` for download.
- Concurrency: in-memory `asyncio.Lock` per run to serialize `/step` and `/auto-step`.
- Strategy (Greedy-tightness): computes deficits and tightness; accepts if the person satisfies any current deficit; otherwise accepts when no deficits remain.
- Database: `Run` and `Event` tables; `Run` stores a "pending person" cache so we persist decided attributes and ensure strict `personIndex` ordering.

Frontend Overview
- Tech: Vite + React + TypeScript + Tailwind.
- Features: Create game, fetch first person, manual accept/reject, auto-run loop (Greedy-tightness), HUD (constraints, venue, efficiency), basic export and events log.
- Keyboard shortcuts: Add easily (A for accept, R for reject, Space for pause) – left as a small follow-up.

Deploy
1) Backend on Render
   - Connect repo, service rootDir: `backend/`.
   - Persistent disk via `render.yaml` (`/opt/render/project/src/data`).
   - Environment vars: `PLAYER_ID`, `EXTERNAL_API_BASE`, `CORS_ORIGINS`.
   - After first deploy, note your backend base URL.
2) Frontend on Vercel
   - Import project pointing to `frontend/`.
   - Env var: `VITE_API_BASE_URL=https://YOUR_RENDER_BACKEND/api`.
   - Deploy.

Tests
- Backend minimal tests: strategy decisions and person index ordering.
- Run via `cd backend && pytest`.

Notes
- Race conditions prevented by per-run locks.
- Feasibility banner logic in UI: shows when remaining slots < sum(deficits) (see ConstraintBar component).
- Errors return informative JSON with status and message; external failures mark run as `failed`.

License
MIT – see `LICENSE`.
