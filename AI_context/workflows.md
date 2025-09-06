# End-to-End Workflows

## Updates (latest)
- **Frontend v2 Workflows**: New Tinder-style interface with image loading, state persistence, and robust auto-run handling.
- **Profile System**: Guest identity with unique display names and leaderboard tracking.
- **Image System**: Signature-based loading with scenario manifests for dynamic image resolution.
- **Streamlined UX**: Eliminated "Fetch First" button - new games automatically load first person.
- **Seamless Restoration**: Page reloads restore complete game state without user interaction.
- **Loading States**: Comprehensive loading management prevents race conditions and provides user feedback.

## Start a New Run (Frontend v2)
1. **Frontend**: User selects a scenario and clicks *New Game* (`Header.tsx`).
2. **State Check**: App checks `settings.confirmBeforeNewGame` and shows confirmation if active run exists.
3. **API Call**: `api.newRun` sends `POST /api/runs/new` with scenario.
4. **Backend Router** (`router_public.py`):
   - Validates scenario.
   - Calls `service_external.new_game` to proxy `/new-game` on external API.
   - Persists a `Run` via `repo.create_run` with constraints and attribute stats.
5. **First Person Auto-Fetch**: Frontend automatically calls `api.step` with `{ personIndex: 0 }`.
6. **Backend**: Processes first person request with per-run locking and external API call.
7. **Response**: First person data returned; frontend updates all state and goes to `manualReady`.
8. **Image Loading**: `SwipeCard` triggers signature-based image loading via `imageLoader.getImageUrl()`:
   - Builds signature from person attributes using shared signature package.
   - Loads scenario manifest (`/manifest/scenario-{n}.json`).
   - Maps signature to available filenames.
   - Randomly selects image for variety.
   - Shows skeleton during loading, then displays image.
9. **Persistence**: Complete run and person data saved to localStorage for session restoration.
10. **Ready to Play**: User can immediately start making accept/reject decisions.

## Manual Decision (Frontend v2)
1. **Frontend**: User clicks *Accept*/*Reject* or uses keyboard (`←`/`→`, `A`/`R`).
2. **Loading Prevention**: `isManualLoading` prevents duplicate requests.
3. **Loading State**: Buttons show spinners, become disabled.
4. **API Call**: `api.step` posts `{ personIndex, accept }` with credentials.
5. **Backend**: Same validation and external API flow as v1.
6. **Response**: Updated run data; frontend updates state, loads new image if next person exists.
7. **Completion Check**: If run completed/failed, shows `ResultModal` and records completion via `api.completeRun`.
8. **Toast Feedback**: Shows "Accepted"/"Rejected" notification.

## Auto-step Loop (Frontend v2)
1. **Frontend**: User switches to Auto tab, selects strategy, clicks *Start Auto*.
2. **State Management**: `isAutoRunning` set to `true`, manual tab disabled.
3. **Sequential Loop**: Async `while` loop replaces `setTimeout` recursion:
   - Makes `api.autoStep` call with current person index and strategy.
   - Waits for response before proceeding.
   - Updates local variables and React state.
   - Waits for `settings.autoRunDelayMs` before next iteration.
   - Checks `isAutoRunning` flag for early termination.
4. **Backend**: `router_public.auto_step_run` with strategy evaluation and external submission.
5. **Error Handling**: Any 409 conflict or error stops auto-run and shows toast notification.
6. **Termination**: Loop stops on completion, failure, user pause, or error.

## Profile & Identity (Frontend v2)
1. **Initial Load**: Frontend calls `GET /api/profile` on mount.
2. **Backend**: `router_v2.get_profile` checks for `guest_id` cookie:
   - If missing, generates UUID and sets HTTP-only cookie.
   - Looks up or creates `Profile` with unique guest name (Guest0001, etc.).
3. **Display Name**: User can edit via Settings modal:
   - `api.updateDisplayName` calls `POST /api/profile/name`.
   - Backend validates uniqueness, returns 409 if taken.
   - Frontend shows inline error or success.

## Leaderboard (Frontend v2)
1. **Frontend**: User clicks *Leaderboard* in header.
2. **API Call**: `api.getLeaderboard` calls `GET /api/leaderboard`.
3. **Backend**: `repo_v2.get_leaderboard` aggregates from `run_completions`:
   - Groups by guest, counts completed scenarios.
   - Sums total rejections across successful runs.
   - Orders by: scenarios completed (desc), total rejections (asc), last completion (desc).
4. **Response**: Ranked list with names, stats, and best run links.

## Session Persistence (Frontend v2)
1. **Enhanced State Saving**: `useLocalStorage` hook saves `{ runId, gameState, scenario, nextPerson, admittedByAttribute }` on all changes.
2. **Seamless Page Reload**: On mount, automatically checks for persisted state:
   - If `runId` exists, calls `api.getRun(runId)` to get updated run summary.
   - Restores `nextPerson` and `admittedByAttribute` directly from localStorage (no extra API calls).
   - Restores exact `gameState` and scenario.
   - Shows "Session restored" toast.
   - **User can immediately continue playing** - image, constraints, and venue stats all appear instantly.
3. **Invalid State**: If run fetch fails, clears persisted data and starts fresh.
4. **No User Interaction Required**: Complete restoration without any button clicks or user action needed.

## Image Manifest Generation
1. **Setup**: Place images in `frontend-2/public/people/` with format `{celebrity}__{signature}.webp`.
2. **Generation**: Run `npm run gen:manifests` from project root.
3. **Script Process**: `scripts/generate-manifests.ts`:
   - Scans for `.webp` files in people directory.
   - Extracts signatures using shared signature package.
   - Groups by detected scenario (heuristic based on signature patterns).
   - Generates `frontend-2/public/manifest/scenario-{n}.json` files.
4. **Runtime**: Frontend loads appropriate manifest and maps person attributes to image filenames.
