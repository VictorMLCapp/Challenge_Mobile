---
phase: 01-vitrine-coerente-no-navegador
reviewed: 2026-09-27T19:47:22Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - index.html
  - src/components/FordRangerRaptor.jsx
  - src/components/HeroUI.jsx
  - src/components/HeroUI.module.css
  - src/components/LoaderUI.module.css
  - src/components/ReportPage.jsx
  - src/components/ReportPage.module.css
  - src/components/SpecsPage.jsx
  - src/components/SpecsPage.module.css
  - src/data/ranger.js
  - src/data/ranger.json
  - src/index.css
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues
---

# Phase 01: Code Review Report

**Reviewed:** 2026-09-27T19:47:22Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues

## Summary

Reviewed the source from plans 01-01 and 01-02 (`a01b576` through `34f33f5`): the Ranger record, the three screens, the model rename, and the tokenized chrome. With the checked-in JSON, `status` is `ok` and the four reconciled facts, motor specs, competitor names, export filenames, document title, and `FordRangerRaptor` export match the plans. Relatório, Voltar, CSV, and TXT stay off accent; PDF, the selected specs chrome, and the loader fill stay on accent.

Two gaps remain. The report still hardcodes the overall score beside the record, and a record that passes `resolveStatus` with an empty spec table or an empty feature list crashes the screen instead of showing the empty or error copy.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Report headline score is a literal, not the vehicle record

**File:** `src/components/ReportPage.jsx:171-174`
**Issue:** `overallScores` in `src/data/ranger.json` is the score source (Ranger Raptor `91`), and the hero card reads the copied highlight `91/100`. The grade header and the projected-score math ignore that record and hardcode `91` and the letter `A`. The UI contract says potência, combustível, concorrentes, and notas come from `ranger.json` only, and those literals must not stay in the screen components. Today the numbers match, so the screen looks right; changing `overallScores` leaves `91/100 · 1º lugar` and the `+N pts` delta on the old baseline. The `Math.min(99, …)` clamp can stay; the baseline cannot stay a second copy of the score.
**Fix:**
```javascript
const raptorScore = overallScores.find((score) => score.name.includes('Ranger'))?.value
const scoreBase = Number.isFinite(raptorScore) ? raptorScore : 0
const projectedScore = Math.min(
  99,
  scoreBase + upgradeRecommendations.reduce((sum, u) => sum + (parseInt(u.impact, 10) || 0), 0),
)
```
```jsx
<span className={styles.overallGradeScore}>{scoreBase}/100 · 1º lugar</span>
<span className={styles.projectedDelta}>+{projectedScore - scoreBase} pts com todos os upgrades</span>
```

### WR-02: Empty spec or feature lists crash while status stays ok

**File:** `src/components/SpecsPage.jsx:306`
**Issue:** `resolveStatus` in `src/data/ranger.js` returns `ok` without looking at `specSections` or `features`. `buildSpecSections` then yields `[]` when that key is missing, and `featuresComparison` is the raw array even when it is empty. The specs table always reads `specSections[activeSection].items` inside the `ok` branch (`SpecsPage.jsx:306`). The report always reads `featuresComparison[activeCategory]` (`ReportPage.jsx:170`) and then `cat.items` (`ReportPage.jsx:356`) inside the `ok` branch. An empty list is not `ok` data: `undefined.items` throws, and the empty/error copy never renders because `status` is still `ok`. The checked-in JSON has both arrays, so the shipped screens do not hit this.
**Fix:**
```javascript
if (!Array.isArray(vehicle.specSections) || vehicle.specSections.length === 0) return 'error'
if (!Array.isArray(vehicle.features) || vehicle.features.length === 0) return 'error'
```
Guard the render anyway so a short list cannot throw:
```javascript
const section = specSections[activeSection]
// map section?.items, not specSections[activeSection].items
```
```javascript
const cat = featuresComparison[activeCategory]
// map cat?.items only when cat exists
```

## Info

### IN-01: Specs score disclaimer has no type role

**File:** `src/components/SpecsPage.jsx:232`
**Issue:** `SCORE_DISCLAIMER` is a bare `<p>` in the explorer. `html` does not set a font size, so the line renders at the browser default (16px) instead of the 14px body role. The report footer is the only styled disclaimer.
**Fix:** Give the paragraph the same body role as `.emptyBody` (14px, weight 400, line-height 1.5, Inter, `var(--text-secondary)`) via the specs module class.

---

_Reviewed: 2026-09-27T19:47:22Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
