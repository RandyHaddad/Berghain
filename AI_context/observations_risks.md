# Observations & Risks

## Resolved Issues (Frontend v2)
- **409 Conflicts Fixed**: Implemented loading states and proper async handling to prevent spam clicking and auto-run race conditions that caused person index mismatches.
- **Auto-run Race Conditions Resolved**: Replaced `setTimeout` recursion with sequential async loop, eliminating concurrent requests with same `personIndex`.
- **Seamless State Persistence**: Enhanced localStorage-based session restoration with complete game state (person data, constraints) without extra API calls or user interaction.
- **Infinite API Calls Fixed**: Resolved useLocalStorage and useEffect infinite loops that caused excessive `/api/profile` requests through proper memoization.
- **Streamlined New Game Flow**: Eliminated "Fetch First" button - new games automatically fetch and display first person in single action.
- **CORS Configuration Updated**: Backend now supports both frontend versions (ports 5173 and 5174).
- **Image Loading Optimized**: Signature-based system with manifests, caching, and proper loading states eliminates broken image references.
- **User Experience Enhanced**: Loading spinners, disabled states, keyboard shortcuts, and comprehensive error handling improve reliability.

## Current System Status
- Events pagination bug fixed: frontend now fetches the last 2000 events instead of offset=0, avoiding a stale event list beyond 2000 processed.
- Optimization applied: `StepResponse` now includes `admittedByAttribute`, removing an extra frontend request per step.
- V2 backend endpoints provide profile management and leaderboard with proper ranking logic.
- Shared signature package ensures consistency between image generation and runtime loading.

## Remaining Risks & Considerations
- **Tests failing**: Running `pytest` in `backend` fails because the `app` package is not on `PYTHONPATH`, and `test_person_index_order.py` is missing `import pytest`. Tests would need path configuration and imports to run.
- **Pending person coupling**: `Run` model caches a `pending_person_index` and attributes; API requires exact match. This tight coupling could be loosened with better state validation.
- **Strategy enumeration**: `decide_accept` in `service_logic.py` uses string matching. Adding new strategies requires manual mapping and lacks validation for unknown names.
- **Duplication of external calls**: Both `step_run` and `auto_step_run` repeat logic for fetching first person, decision handling, and run updates; refactoring could reduce duplication.
- **Image generation tool complexity**: `openai_client.py` contains extensive branching to handle multiple API modes (generate/edit, SDK/HTTP). The large monolithic function increases maintenance difficulty.
- **Database choice**: SQLite is used with async engine; concurrent writes are serialized with locks but high concurrency on Render may still hit SQLite limitations.
- **Frontend v1 vs v2**: Two frontend implementations exist; consider consolidating or clearly documenting which is primary for production.

## Potential Optimizations
- Compute admitted counts via a single SQL query (`GROUP BY`), or maintain a materialized counter table.
- Consider adding `total` to `GET /runs/{id}/events` to compute offsets without relying on `admitted+rejected`.
- Provide server-side aggregates for rejected-by-attribute and other metrics to avoid client-side scans.
- Image preloading strategy for improved perceived performance.
- WebSocket integration for real-time updates across multiple clients.
