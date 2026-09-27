---
phase: 01-vitrine-coerente-no-navegador
plan: 01
subsystem: ui
tags: [react, vite, json, ranger-raptor]

requires: []
provides:
  - Single vehicle record in src/data/ranger.json
  - Screen slices and formatters in src/data/ranger.js
  - Início, especificações, and relatório reading that module
  - Document title Ford Ranger Raptor and model function FordRangerRaptor
affects: [01-02, phase-2, phase-3]

tech-stack:
  added: []
  patterns:
    - "Screens import vehicle facts only from src/data/ranger.js"
    - "ranger.js imports ranger.json with { type: 'json' }"
    - "Potência, torque, and 0-100 display strings are formatted in ranger.js"

key-files:
  created:
    - src/data/ranger.json
    - src/data/ranger.js
  modified:
    - src/components/HeroUI.jsx
    - src/components/SpecsPage.jsx
    - src/components/ReportPage.jsx
    - src/components/FordRangerRaptor.jsx
    - index.html

key-decisions:
  - "Specs-page figures are the display source: potência, torque, and 0-100 are formatted in ranger.js from ranger.json"

patterns-established:
  - "Pattern: one JSON record, one formatter module, three screens import slices"
  - "Pattern: empty and error copy render as React text children"

requirements-completed: [DATA-01, DATA-02, CODE-01]

duration: 10 min
completed: 2026-09-27
---

# Phase 1 Plan 01: Vitrine coerente no navegador Summary

**One `src/data/ranger.json` record feeds início, especificações, and relatório, and the tab title, model function, and downloads say Ranger Raptor**

## Performance

- **Duration:** 10 min
- **Started:** 2026-09-27T19:17:09Z
- **Completed:** 2026-09-27T19:27:23Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Início shows Motor 3.0 V6 Bi-turbo Diesel, Potência 397 cv @ 3.500 rpm, Torque 583 Nm @ 1.750-3.000 rpm, and Tração 4x4 inteligente com baixa from the shared record.
- Especificações and the relatório use that same record for those figures, the five competitor names, and the explorer scores that already existed.
- The document title is Ford Ranger Raptor, the model function is FordRangerRaptor, and CSV/TXT download as ford-ranger-raptor-relatorio.csv and ford-ranger-raptor-relatorio.txt.

## Task Commits

Each task was committed atomically:

1. **Task 1: Home facts come from one Ranger record** - `a01b576` (feat)
2. **Task 2: Specs table and explorer scores use that record** - `42de6ac` (feat)
3. **Task 3: Report, document title, and model name identify this Ranger** - `2706c54` (feat)

## Files Created/Modified
- `src/data/ranger.json` - Single vehicle record; 397 and 583 each appear once
- `src/data/ranger.js` - JSON import with `{ type: 'json' }`, formatters, and screen slices
- `src/components/HeroUI.jsx` - Home facts and empty/error copy from the module
- `src/components/SpecsPage.jsx` - Spec table, explorer comparisons, and score disclaimer from the module
- `src/components/ReportPage.jsx` - Report figures, competitor summary, and download filenames from the module
- `src/components/FordRangerRaptor.jsx` - Default export renamed to FordRangerRaptor
- `index.html` - `lang="pt-BR"` and title Ford Ranger Raptor

## Decisions Made
Specs-page figures are the display source. `ranger.js` formats potência, torque, and 0-100 from the numeric fields in `ranger.json`. Competitor color maps stay in `ReportPage.jsx` and join onto the shared competitor list by id.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
`npm run lint` still exits 1 because `src/components/LoaderUI.jsx` line 14 trips `react-hooks/set-state-in-effect`. That file was not part of this plan. ESLint on the files this plan changed exits 0. Logged in `deferred-items.md`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Ready for 01-02. The three screens already share one vehicle record, so the next plan can unify color, type, and the home header without reconciling facts again.

## Self-Check: PASSED

- FOUND: src/data/ranger.json
- FOUND: src/data/ranger.js
- FOUND: src/components/HeroUI.jsx
- FOUND: src/components/SpecsPage.jsx
- FOUND: src/components/ReportPage.jsx
- FOUND: src/components/FordRangerRaptor.jsx
- FOUND: index.html
- FOUND: a01b576
- FOUND: 42de6ac
- FOUND: 2706c54

---
*Phase: 01-vitrine-coerente-no-navegador*
*Completed: 2026-09-27*
