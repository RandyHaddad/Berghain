# Component Overview

## Backend (FastAPI)
- **API Layer**: `router_public.py` exposes REST endpoints under `/api` for creating runs, stepping decisions, auto-stepping with strategies, pausing/resuming, exporting, event listing, and admitted-by-attribute aggregation.
- **V2 API Layer**: `router_v2.py` adds new endpoints for profile management (`/api/profile`), leaderboard (`/api/leaderboard`), and run completion tracking with HTTP-only cookie-based guest identity.
- **Config & Utilities**: `config.py` loads environment-driven settings including CORS origins for both frontend versions; `utils.py` provides JSON helpers and UTC timestamps.
- **Database Layer**: `db.py` sets up SQLAlchemy async engine and sessions; `models.py` defines `Run` and `Event` tables; `models_v2.py` adds `Profile` and `RunCompletion` tables for v2 features.
- **Repository Layer**: `repo.py` offers CRUD helpers for runs and events; `repo_v2.py` handles profile management, unique display names, and leaderboard aggregation.
- **Concurrency Control**: `locks.py` supplies per-run `asyncio.Lock` to serialize API calls.
- **External Service**: `service_external.py` proxies to the challenge API with retry logic.
- **Business Logic / Strategy**: `service_logic.py` validates person indices, counts admitted attributes, and implements multiple decision strategies.
- **Application Startup**: `main.py` creates FastAPI app, configures CORS for both frontends, initializes DB with v2 models, and mounts both routers.

## Frontend v1 (React + Vite) - Original
- **App Shell**: `App.tsx` holds global state for scenarios, runs, and the latest event window (last 2000), manages the auto-run loop and strategy selection, and renders UI. Constraint bars now use server-provided admitted-by-attribute counts for full-run accuracy.
- **API Client**: `lib/api.ts` wraps fetch calls to backend endpoints, including `admittedByAttribute`; `lib/types.ts` defines TypeScript interfaces mirroring backend schemas.
- **UI Components**: `ConstraintBar`, `PersonCard`, `VenueOverview`, `StrategyControls`, and `PlaybackControls` render constraint progress, current person attributes, run metrics, strategy selection, and playback/export actions.
- **Entry & Build Config**: `index.html`, `main.tsx`, `styles.css`, `tailwind.config.js`, `postcss.config.js`, and `vite.config.ts` compose the build pipeline with Tailwind and Vite.

## Frontend v2 (React + TypeScript + Vite + Tailwind + Framer Motion) - New
- **App Shell**: `App.tsx` manages game state machine, profile system, auto-run logic, state persistence, and loading states. Implements robust async handling to prevent race conditions and 409 conflicts.
- **API Client**: `lib/api.ts` includes v2 endpoints for profile and leaderboard; `lib/imageLoader.ts` handles signature-based image loading with manifests and caching.
- **State Management**: `hooks/useLocalStorage.ts`, `hooks/useKeyboard.ts`, `hooks/useToast.ts` provide reusable state and UI logic.
- **Core Components**: `SwipeCard` (Tinder-style with loading states), `AutoControls` (strategy selection), `Header` (scenario, profile, actions), constraint and stats panels.
- **Modal System**: `LeaderboardModal`, `SettingsModal`, `ResultModal` for complex interactions; `Toasts` for notifications.
- **UI Foundation**: `Button`, `Modal` base components with framer-motion animations and consistent styling.

## Shared Packages
- **Signature Builder**: `packages/signature/` provides shared TypeScript library for generating attribute signatures used by both image generation and frontend runtime. Ported from Python abbreviations system.

## Image System
- **Manifest Generator**: `scripts/generate-manifests.ts` scans WEBP files and creates scenario manifests mapping signatures to available images.
- **Generation Tool**: Enhanced images-generation system with scenario-aware signatures and deterministic filename generation.
- **Runtime Loading**: Frontend v2 uses signature-based image resolution with random selection for variety and skeleton loading states.
