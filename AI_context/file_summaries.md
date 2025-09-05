# File Summaries

## Updates (latest)
- Added backend endpoint `GET /api/runs/{id}/admitted-by-attribute` (router_public.py) and schema `AdmittedByAttributeResponse` (schemas.py).
- Frontend `lib/api.ts` now exposes `admittedByAttribute(runId)` and `types.ts` defines its response type.
- `App.tsx` now fetches the last 2000 events using offset/limit and uses server-side admitted-by-attribute counts for constraint bars.

## Root
- **README.md** – high level project overview and setup instructions for backend and frontend.
- **render.yaml** – Render deployment configuration for backend, including environment variables and persistent disk.
- **LICENSE** – MIT license terms for repository.

## Backend
- **backend/README.md** – notes for running FastAPI backend, environment variables, and design description.
- **backend/Dockerfile** – container definition installing requirements and starting Uvicorn.
- **backend/requirements.txt** – Python dependencies (FastAPI, SQLAlchemy, etc.).
- **backend/app/__init__.py** – empty module initializer.
- **backend/app/config.py** – `Settings` Pydantic model loading environment variables; exposes `settings` instance and async SQLite URL helper.
- **backend/app/db.py** – SQLAlchemy async engine setup, Base declaration, database initialization, and `get_session` dependency.
- **backend/app/locks.py** – maintains per-run `asyncio.Lock` objects via `get_lock` for serialized run steps.
- **backend/app/main.py** – FastAPI application creation, CORS middleware, database startup, and router inclusion.
- **backend/app/models.py** – ORM models `Run` and `Event` storing run metadata, pending person cache, and decisions.
- **backend/app/repo.py** – data access helpers to create runs, update counts, manage pending person cache, and list or add events.
- **backend/app/router_public.py** – FastAPI router defining public API endpoints for creating runs, stepping decisions, auto-step, pause/resume, export, and event listing. Uses repo functions, locking, and external service calls.
- **backend/app/schemas.py** – Pydantic models for requests/responses (`NewRunRequest`, `RunSummary`, `StepRequest`, `AutoStepRequest`, etc.).
- **backend/app/service_external.py** – httpx client wrappers with Tenacity retries for `/new-game` and `/decide-and-next` external API.
- **backend/app/service_logic.py** – business logic: person index validation, multiple decision strategies (`decide_accept_greedy`, `expected_feasible`, `risk_adjusted_feasible`, `proportional_control`, `lookahead_1`), and counting admitted attributes.
- **backend/app/utils.py** – JSON helpers and UTC timestamp formatting.
- **backend/tests/test_person_index_order.py** – tests for `validate_next_person_index` sequencing.
- **backend/tests/test_strategy.py** – tests for greedy strategy and expected-feasible guard.

## Frontend
- **frontend/index.html** – HTML entry point loading `src/main.tsx`.
- **frontend/package.json** – project metadata, React and build tooling dependencies, and npm scripts.
- **frontend/postcss.config.js** – PostCSS setup with Tailwind and Autoprefixer.
- **frontend/tailwind.config.js** – Tailwind CSS configuration scanning html and `src`.
- **frontend/vite.config.ts** – Vite config with React plugin and dev server port.
- **frontend/src/main.tsx** – React root rendering `App` component and importing styles.
- **frontend/src/styles.css** – Tailwind directives and base height styling.
- **frontend/src/App.tsx** – main application component orchestrating runs, events, auto-run loop, and UI composition.
- **frontend/src/components/ConstraintBar.tsx** – displays progress toward attribute constraints and tightness metric.
- **frontend/src/components/PersonCard.tsx** – renders attributes of the current person.
- **frontend/src/components/PlaybackControls.tsx** – export and reload controls for event history.
- **frontend/src/components/StrategyControls.tsx** – strategy selection and start/stop for auto-run.
- **frontend/src/components/VenueOverview.tsx** – shows run status, counts, and efficiency.
- **frontend/src/lib/api.ts** – fetch wrappers for backend API endpoints (`newRun`, `step`, `autoStep`, `listEvents`, `getRun`).
- **frontend/src/lib/types.ts** – TypeScript type definitions mirroring backend schemas.

## Images Generation Tool
- **images-generation/README.md** – instructions for generating caricature images via OpenAI, configuration, and CLI usage.
- **images-generation/config.yaml.example** – template configuration for attributes, celebrities, and image settings.
- **images-generation/images_generation/__main__.py** – module entry point executing `main()`.
- **images-generation/images_generation/__init__.py** – empty package initializer.
- **images-generation/images_generation/abbreviations.py** – builds unique attribute tokens and encodes bit combinations.
- **images-generation/images_generation/combos.py** – enumerates bit combinations and assigns celebrities deterministically with restrictions.
- **images-generation/images_generation/config.py** – Pydantic configuration models, environment loading, and validation for image generation settings.
- **images-generation/images_generation/fileio.py** – filename/manifest utilities and slugification helpers.
- **images-generation/images_generation/main.py** – CLI entry parsing args, loading config, and calling runner.
- **images-generation/images_generation/openai_client.py** – `OpenAIImageClient` handling image generation/editing with retries, OpenAI SDK or HTTP fallbacks.
- **images-generation/images_generation/prompt_builder.py** – constructs structured prompts and converts to text for image requests.
- **images-generation/images_generation/runner.py** – orchestrates generation: builds combinations, plans assignments, invokes client concurrently, and writes manifest.
- **images-generation/images_generation/utils.py** – time utilities, mask building/normalization, random helpers, hashing.
- **images-generation/requirements.txt** – dependencies for image generation tool.
