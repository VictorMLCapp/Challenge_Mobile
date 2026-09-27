# Deferred Items

## Pre-existing lint

- **File:** `src/components/LoaderUI.jsx` line 14
- **Found during:** Plan 01-01 Task 3 verification (`npm run lint`)
- **Issue:** `react-hooks/set-state-in-effect` reports `setOpacity(0)` called directly inside an effect
- **Why deferred:** The file is outside this plan. The executor scope boundary leaves pre-existing lint in untouched files alone.
- **Status:** open
- **Reconfirmed:** Plan 01-02 Task 3 (`npm run lint`) still exits 1 on this same error. `LoaderUI.jsx` was not edited.
