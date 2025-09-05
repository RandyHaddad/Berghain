# End-to-End Workflows

## Updates (latest)
- Constraint bars now use server-side admitted-by-attribute counts for full-run accuracy.
- Events UI reloads the latest window (last 2000) using offset/limit instead of always offset=0.

## Start a New Run
1. **Frontend**: User selects a scenario and clicks *New Game* (`App.tsx`).
2. **API Call**: `api.newRun` sends `POST /api/runs/new` with scenario.
3. **Backend Router** (`router_public.py`):
   - Validates scenario.
   - Calls `service_external.new_game` to proxy `/new-game` on external API.
   - Persists a `Run` via `repo.create_run` with constraints and attribute stats.
4. **Response**: `RunSummary` returned to frontend and stored in state.

## Fetch First Person
1. **Frontend**: User clicks *Fetch First*.
2. **API Call**: `api.step` posts `{ personIndex: 0 }` to `/runs/{id}/step`.
3. **Backend**:
   - `router_public.step_run` acquires per-run lock via `get_lock`.
   - Calls external `/decide-and-next` with no decision.
   - Caches pending person attributes in `Run` via `set_run_pending_person`.
4. **Response**: Next person data returned; frontend shows `PersonCard`.

## Manual Decision
1. **Frontend**: User clicks *Accept* or *Reject*.
2. **API Call**: `api.step` posts `{ personIndex, accept }`.
3. **Backend**:
   - Validates person index order using `service_logic.validate_next_person_index`.
   - Ensures pending person matches.
   - Calls external `/decide-and-next` with decision.
   - Persists `Event` and updates `Run` counts/pending via repo.
4. **Response**: Updated run, event summary, and next person (if any) sent back. Events reload via `api.listEvents`.

## Auto-step Loop
1. **Frontend**: User enables auto-run and selects strategy.
2. **Loop** (`App.tsx`): Periodically calls `api.autoStep` with current index and strategy.
3. **Backend**: `router_public.auto_step_run` decides accept/reject using `service_logic.decide_accept` and internal strategies, submits decision externally, stores event, and updates run.
4. **Termination**: Loop stops when run status not `running` or capacity reached.

## Export Events
1. **Frontend**: User clicks *Export JSON* in `PlaybackControls`.
2. **API Call**: Downloads `/api/runs/{id}/export` which returns run summary and all events for replay.
