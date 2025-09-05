# Component Overview

## Backend (FastAPI)
- **API Layer**: `router_public.py` exposes REST endpoints under `/api` for creating runs, stepping decisions, auto-stepping with strategies, pausing/resuming, exporting, event listing, and admitted-by-attribute aggregation.
- **Config & Utilities**: `config.py` loads environment-driven settings; `utils.py` provides JSON helpers and UTC timestamps.
- **Database Layer**: `db.py` sets up SQLAlchemy async engine and sessions; `models.py` defines `Run` and `Event` tables.
- **Repository Layer**: `repo.py` offers CRUD helpers for runs and events, including pending-person cache management.
- **Concurrency Control**: `locks.py` supplies per-run `asyncio.Lock` to serialize API calls.
- **External Service**: `service_external.py` proxies to the challenge API with retry logic.
- **Business Logic / Strategy**: `service_logic.py` validates person indices, counts admitted attributes, and implements multiple decision strategies.
- **Application Startup**: `main.py` creates FastAPI app, configures CORS, initializes DB, and mounts router.

## Frontend (React + Vite)
- **App Shell**: `App.tsx` holds global state for scenarios, runs, and the latest event window (last 2000), manages the auto-run loop and strategy selection, and renders UI. Constraint bars now use server-provided admitted-by-attribute counts for full-run accuracy.
- **API Client**: `lib/api.ts` wraps fetch calls to backend endpoints, including `admittedByAttribute`; `lib/types.ts` defines TypeScript interfaces mirroring backend schemas.
- **UI Components**: `ConstraintBar`, `PersonCard`, `VenueOverview`, `StrategyControls`, and `PlaybackControls` render constraint progress, current person attributes, run metrics, strategy selection, and playback/export actions.
- **Entry & Build Config**: `index.html`, `main.tsx`, `styles.css`, `tailwind.config.js`, `postcss.config.js`, and `vite.config.ts` compose the build pipeline with Tailwind and Vite.

## Images Generation Tool
- **Configuration**: `config.py` loads and validates image generation settings (attributes, celebrities, output, model options).
- **Prompt & Planning**: `abbreviations.py`, `combos.py`, and `prompt_builder.py` derive attribute tokens, generate combinations, assign celebrities, and craft prompts.
- **Execution**: `runner.py` orchestrates concurrent image creation using `OpenAIImageClient` from `openai_client.py`, handling retries and manifest management via `fileio.py` and `utils.py`.
- **CLI**: `main.py` parses CLI arguments, loads config, and triggers the runner; `__main__.py` exposes module entry.
