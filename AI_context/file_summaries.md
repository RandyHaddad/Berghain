# File Summaries

## Updates (latest)
- **Frontend v2 Implementation**: Complete new frontend in `frontend-2/` with React+TypeScript+Vite+Tailwind+framer-motion, desktop-only design, Tinder-style interface, and robust state management.
- **Backend v2 Endpoints**: Added profile management, leaderboard system, and run completion tracking with HTTP-only cookie authentication.
- **Shared Signature System**: Created `packages/signature/` for consistent attribute signature generation between image creation and runtime.
- **Manifest Generator**: Built `scripts/generate-manifests.ts` to scan images and create scenario-based manifests for dynamic image loading.
- **Race Condition Fixes**: Resolved 409 conflicts in auto-run and manual spam-clicking through proper async handling and loading states.
- **Seamless Session Restoration**: Enhanced localStorage-based persistence with automatic restoration of person data, constraints, and game state without user interaction.
- **Streamlined New Game Flow**: Eliminated "Fetch First" button - new games automatically fetch and display first person in single click.
- **Fixed Infinite API Calls**: Resolved useLocalStorage and useEffect infinite loop issues causing excessive /api/profile requests.
- **CORS Configuration**: Updated to support both frontend versions (ports 5173 and 5174).

## Root
- **README.md** – high level project overview and setup instructions for backend and frontend.
- **render.yaml** – Render deployment configuration for backend, including environment variables and persistent disk.
- **LICENSE** – MIT license terms for repository.

## Backend
- **backend/README.md** – notes for running FastAPI backend, environment variables, and design description.
- **backend/Dockerfile** – container definition installing requirements and starting Uvicorn.
- **backend/requirements.txt** – Python dependencies (FastAPI, SQLAlchemy, etc.).
- **backend/app/__init__.py** – empty module initializer.
- **backend/app/config.py** – `Settings` Pydantic model loading environment variables; updated CORS origins for both frontend versions; exposes `settings` instance and async SQLite URL helper.
- **backend/app/db.py** – SQLAlchemy async engine setup, Base declaration, database initialization with v2 models import, and `get_session` dependency.
- **backend/app/locks.py** – maintains per-run `asyncio.Lock` objects via `get_lock` for serialized run steps.
- **backend/app/main.py** – FastAPI application creation, CORS middleware for both frontends, database startup, model imports, and both router inclusions.
- **backend/app/models.py** – ORM models `Run` and `Event` storing run metadata, pending person cache, and decisions.
- **backend/app/models_v2.py** – v2 ORM models `Profile` (guest identity, unique display names) and `RunCompletion` (leaderboard tracking).
- **backend/app/repo.py** – data access helpers to create runs, update counts, manage pending person cache, and list or add events.
- **backend/app/repo_v2.py** – v2 data access for profile management, unique name validation, run completion recording, and leaderboard aggregation with ranking logic.
- **backend/app/router_public.py** – FastAPI router defining public API endpoints for creating runs, stepping decisions, auto-step, pause/resume, export, and event listing. Uses repo functions, locking, and external service calls.
- **backend/app/router_v2.py** – v2 FastAPI router adding profile endpoints (`/api/profile`, `/api/profile/name`), leaderboard (`/api/leaderboard`), and run completion tracking with HTTP-only cookie guest authentication.
- **backend/app/schemas.py** – Pydantic models for requests/responses including v2 schemas (`ProfileResponse`, `LeaderboardEntry`, `UpdateDisplayNameRequest`, etc.).
- **backend/app/service_external.py** – httpx client wrappers with Tenacity retries for `/new-game` and `/decide-and-next` external API.
- **backend/app/service_logic.py** – business logic: person index validation, multiple decision strategies (`decide_accept_greedy`, `expected_feasible`, `risk_adjusted_feasible`, `proportional_control`, `lookahead_1`), and counting admitted attributes.
- **backend/app/utils.py** – JSON helpers and UTC timestamp formatting.
- **backend/tests/test_person_index_order.py** – tests for `validate_next_person_index` sequencing.
- **backend/tests/test_strategy.py** – tests for greedy strategy and expected-feasible guard.

## Frontend v1 (Original)
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

## Frontend v2 (New Implementation)
- **frontend-2/index.html** – HTML entry with dark theme body classes and v2 title.
- **frontend-2/package.json** – v2 dependencies including framer-motion and shared signature package.
- **frontend-2/vite.config.ts** – Vite config with port 5174 to avoid conflicts.
- **frontend-2/tailwind.config.js** – enhanced Tailwind with custom Berghain color palette and aspect-ratio utilities.
- **frontend-2/src/main.tsx** – React root with v2 App component.
- **frontend-2/src/styles.css** – custom scrollbar, skeleton animations, focus styles for dark theme.
- **frontend-2/src/App.tsx** – comprehensive state machine with streamlined new game flow (auto-fetches first person), seamless session restoration, loading management, auto-run async handling, enhanced state persistence, keyboard shortcuts, and modal orchestration.
- **frontend-2/src/types.ts** – complete TypeScript definitions including v2 types, game states, settings, and decision strategies.
- **frontend-2/src/lib/api.ts** – API client with v2 endpoints, credentials inclusion, and enhanced error handling.
- **frontend-2/src/lib/imageLoader.ts** – signature-based image loading system with manifest parsing, caching, and fallback handling.
- **frontend-2/src/hooks/useLocalStorage.ts** – localStorage hook with JSON serialization, error handling, and memoized setter function to prevent infinite re-renders.
- **frontend-2/src/hooks/useKeyboard.ts** – keyboard event handler with input field detection and conditional enabling.
- **frontend-2/src/hooks/useToast.ts** – toast notification system with auto-dismiss and manual control.
- **frontend-2/src/components/Header.tsx** – top navigation with scenario selection, new game button, profile display, and action buttons (leaderboard, settings, copy game ID).
- **frontend-2/src/components/SwipeCard.tsx** – Tinder-style card with square aspect ratio, image loading states, attribute overlays, and disabled states during auto-run.
- **frontend-2/src/components/AutoControls.tsx** – strategy selection, auto-run controls with status indicators and delay display.
- **frontend-2/src/components/ConstraintsPanel.tsx** – constraint progress bars with tightness calculations and infeasibility warnings.
- **frontend-2/src/components/VenueStats.tsx** – venue metrics with efficiency calculations and progress visualization.
- **frontend-2/src/components/FeasibilityBanner.tsx** – dismissible warning banner for impossible constraint scenarios.
- **frontend-2/src/components/LeaderboardModal.tsx** – global leaderboard with ranking, loading states, and run viewing.
- **frontend-2/src/components/SettingsModal.tsx** – profile management, display name editing, audio settings, delay configuration, theme selection, and run export.
- **frontend-2/src/components/ResultModal.tsx** – run completion modal with statistics, efficiency metrics, and navigation options.
- **frontend-2/src/components/Button.tsx** – reusable button component with variants, sizes, loading states, and framer-motion animations.
- **frontend-2/src/components/Modal.tsx** – modal foundation with escape handling, backdrop clicks, focus management, and animations.
- **frontend-2/src/components/Toasts.tsx** – toast notification display with animations, auto-dismiss, and multiple types.
- **frontend-2/public/manifest/** – generated scenario manifests mapping attribute signatures to available image files.
- **frontend-2/public/people/** – image directory for person portraits organized by signature-based naming.
- **frontend-2/README.md** – comprehensive documentation for setup, features, keyboard shortcuts, environment variables, and production deployment.

## Shared Packages
- **packages/signature/package.json** – shared signature builder package with ES module exports and TypeScript compilation.
- **packages/signature/tsconfig.json** – TypeScript config for ES2020 modules with declaration generation.
- **packages/signature/src/index.ts** – signature builder implementation ported from Python abbreviations system with scenario-aware attribute mapping and filename extraction utilities.

## Scripts & Tools
- **scripts/generate-manifests.ts** – Node/TypeScript script scanning WEBP files, extracting signatures, grouping by scenario, and generating runtime manifests with validation and logging.
- **package.json** (root) – workspace configuration with manifest generation script and shared package management.

## Images Generation Tool
- **images-generation/README.md** – instructions for generating caricature images via OpenAI, configuration, and CLI usage.
- **images-generation/config.yaml.example** – template configuration for attributes, celebrities, and image settings.
- **images-generation/images_generation/__main__.py** – module entry point executing `main()`.
- **images-generation/images_generation/__init__.py** – empty package initializer.
- **images-generation/images_generation/abbreviations.py** – builds unique attribute tokens and encodes bit combinations (source for shared signature package).
- **images-generation/images_generation/combos.py** – enumerates bit combinations and assigns celebrities deterministically with restrictions.
- **images-generation/images_generation/config.py** – Pydantic configuration models, environment loading, and validation for image generation settings.
- **images-generation/images_generation/fileio.py** – filename/manifest utilities and slugification helpers with signature-based naming.
- **images-generation/images_generation/main.py** – CLI entry parsing args, loading config, and calling runner.
- **images-generation/images_generation/openai_client.py** – `OpenAIImageClient` handling image generation/editing with retries, OpenAI SDK or HTTP fallbacks.
- **images-generation/images_generation/prompt_builder.py** – constructs structured prompts and converts to text for image requests.
- **images-generation/images_generation/runner.py** – orchestrates generation: builds combinations, plans assignments, invokes client concurrently, and writes manifest.
- **images-generation/images_generation/utils.py** – time utilities, mask building/normalization, random helpers, hashing.
- **images-generation/requirements.txt** – dependencies for image generation tool.
