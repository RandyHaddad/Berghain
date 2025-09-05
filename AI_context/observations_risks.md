# Observations & Risks

- **Tests failing**: Running `pytest` in `backend` fails because the `app` package is not on `PYTHONPATH`, and `test_person_index_order.py` is missing `import pytest`. Tests would need path configuration and imports to run.
- **Pending person coupling**: `Run` model caches a `pending_person_index` and attributes; API requires exact match. Any mismatch results in `409`, which tightly couples backend state to external API flow.
- **Strategy enumeration**: `decide_accept` in `service_logic.py` uses string matching. Adding new strategies requires manual mapping and lacks validation for unknown names.
- **Auto-run loop control**: Frontend `App.tsx` manages an interval using `setTimeout` recursion. Failures in API calls stop auto-run but there is minimal user feedback beyond console errors.
- **Duplication of external calls**: Both `step_run` and `auto_step_run` repeat logic for fetching first person, decision handling, and run updates; refactoring could reduce duplication.
- **Image generation tool complexity**: `openai_client.py` contains extensive branching to handle multiple API modes (generate/edit, SDK/HTTP). The large monolithic function increases maintenance difficulty.
- **Missing environment safeguards**: Frontend assumes `VITE_API_BASE_URL` env var; backend defaults may expose actual `PLAYER_ID` if not overridden.
- **Database choice**: SQLite is used with async engine; concurrent writes are serialized with locks but high concurrency on Render may still hit SQLite limitations.
