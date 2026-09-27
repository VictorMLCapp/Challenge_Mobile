---
phase: 01-vitrine-coerente-no-navegador
plan: 02
subsystem: ui
tags: [react, css, tokens, vite]

requires:
  - phase: 01-vitrine-coerente-no-navegador
    provides: One Ranger record and the empty-state class names on the three screens
provides:
  - Logo-only home header
  - Home, specs, report, and loader chrome using the existing src/index.css tokens
  - Four type roles on the named text, and a 1px accent focus outline on buttons
affects: [phase-2, phase-3]

tech-stack:
  added: []
  patterns:
    - "Exact token hexes map to var(--bg), var(--surface), var(--border), var(--accent), var(--text-primary), var(--text-secondary), and var(--accent-glow)"
    - "Accent stays on Ver Specs, selected specs chrome, the PDF control, and the loader bar"

key-files:
  created: []
  modified:
    - src/index.css
    - src/components/HeroUI.jsx
    - src/components/HeroUI.module.css
    - src/components/SpecsPage.module.css
    - src/components/ReportPage.module.css
    - src/components/LoaderUI.module.css

key-decisions:
  - "Empty-state rules use :global so the class names from plan 01-01 receive the type roles"
  - "The shared export active state stays off accent; PDF active is a separate .exportBtnPdf.exportBtnActive rule"

patterns-established:
  - "Pattern: replace only exact palette copies; grade and competitor series hexes stay literal"
  - "Pattern: Relatório, Voltar, CSV, and TXT do not use var(--accent)"

requirements-completed: [VIS-01, VIS-02]

duration: 6 min
completed: 2026-09-27
---

# Phase 1 Plan 02: Vitrine coerente no navegador Summary

**The home header is the Ford logo only, and início, especificações, and relatório use the existing palette tokens and the four type roles**

## Performance

- **Duration:** 6 min
- **Started:** 2026-09-27T19:28:48Z
- **Completed:** 2026-09-27T19:35:17Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Início shows the Ford logo and no Modelos, Configurar, Dealer, or Solicitar Proposta. Ver Specs stays the filled accent button in the left panel, next to Relatório.
- Named text uses the four roles: Ranger at 96px, fact figures at 20px, the description at 14px, and labels at 12px weight 600. Exact palette copies now read the variables in `src/index.css`.
- Relatório and Voltar are not accent. CSV and TXT stay off accent. PDF keeps an accent border and label, including while active. Grade B stays `#f54b2e`. Buttons draw a 1px accent outline on `:focus-visible`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Home header is the logo, and home type uses the tokens** - `a27b6b8` (feat)
2. **Task 2: Specs chrome uses the tokens without painting Relatório accent** - `c7c8958` (feat)
3. **Task 3: Report and loader chrome use the tokens** - `9656f4f` (feat)

## Files Created/Modified
- `src/components/HeroUI.jsx` - Header is the logo button with `alt="Ford"`
- `src/components/HeroUI.module.css` - Home type roles and token colors; nav rules removed
- `src/index.css` - `button:focus-visible` outline `1px solid var(--accent)`
- `src/components/SpecsPage.module.css` - Specs chrome tokens; Relatório and Voltar off accent
- `src/components/ReportPage.module.css` - Report type roles, PDF accent, grade hexes left literal
- `src/components/LoaderUI.module.css` - Loader status at 12px weight 600 and bar fill `var(--accent)`

## Decisions Made
Empty-state headings and bodies stay on the literal class names plan 01-01 rendered. The type-role rules are `:global(.emptyHeading)` and `:global(.emptyBody)` so a CSS module hash does not miss them. The shared `.exportBtnActive` rule is background, border, and text only, with no accent; `.exportBtnPdf.exportBtnActive` puts the accent back on PDF.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Style empty-state classes as global selectors**
- **Found during:** Task 1 (Home header is the logo, and home type uses the tokens)
- **Issue:** Plan 01-01 rendered `className="emptyHeading"` and `className="emptyBody"`. A local CSS module class would be hashed and would not reach those elements. Tasks 2 and 3 forbid editing `SpecsPage.jsx` and `ReportPage.jsx`.
- **Fix:** Declared `:global(.emptyHeading)` and `:global(.emptyBody)` in the three modules with the type-role declarations from the plan.
- **Files modified:** `src/components/HeroUI.module.css`, `src/components/SpecsPage.module.css`, `src/components/ReportPage.module.css`
- **Verification:** The global selectors are in each module, and the JSX class names are unchanged.
- **Committed in:** `a27b6b8`, `c7c8958`, `9656f4f` (part of each task commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** The empty and error copy now receives the heading and body roles. No new screen, token, or dependency.

## Issues Encountered
`npm run lint` still exits 1 because `src/components/LoaderUI.jsx` line 14 trips `react-hooks/set-state-in-effect`. This plan did not edit that file. The same item stays open in `deferred-items.md`. The CSS checks for this plan passed, and a desktop pass of início, especificações, and relatório showed the logo-only header, Relatório off accent, and PDF as the accent export.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Phase 1 plans are complete. Colors, type roles, and the home header match the UI contract. The specs sheet still overlaps the explorer at 700px; that reflow is Phase 2. Ready for phase verification, then Phase 2.

## Self-Check: PASSED

- FOUND: src/index.css
- FOUND: src/components/HeroUI.jsx
- FOUND: src/components/HeroUI.module.css
- FOUND: src/components/SpecsPage.module.css
- FOUND: src/components/ReportPage.module.css
- FOUND: src/components/LoaderUI.module.css
- FOUND: a27b6b8
- FOUND: c7c8958
- FOUND: 9656f4f

---
*Phase: 01-vitrine-coerente-no-navegador*
*Completed: 2026-09-27*
