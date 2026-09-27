---
phase: 01-vitrine-coerente-no-navegador
verified: 2026-09-27T19:40:49Z
status: human_needed
score: 8/8 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open the app in the browser. On início, read the four facts, the header, and the tab title. Click Ver Specs, then Relatório."
    expected: "One Ranger Raptor. Motor 3.0 V6 Bi-turbo Diesel, Potência 397 cv @ 3.500 rpm, Torque 583 Nm @ 1.750-3.000 rpm, and Tração 4x4 inteligente com baixa on início and in the specs table. The report shows that same power, torque, 5,4 segundos, and the names Ranger Raptor, Hilux GR-S, Amarok V6, S10 High Country, and L200 Triton. The tab title is Ford Ranger Raptor."
    why_human: "Rendered copy and navigation across the three screens are visual."
  - test: "On a desktop-width window, look at início, especificações, and relatório. Tab to a button."
    expected: "Início header is the Ford logo only. Ver Specs is the filled accent button. Relatório, Voltar, CSV, and TXT are not accent. PDF keeps an accent border and label. Focus draws a 1px accent outline. Fact figures, Ranger, the description, and the loader status use the existing type roles."
    why_human: "Accent, type, and the focus ring are appearance, not a grep result."
  - test: "On the report, download CSV and TXT."
    expected: "The files save as ford-ranger-raptor-relatorio.csv and ford-ranger-raptor-relatorio.txt."
    why_human: "The download attribute is set in code; the save dialog is browser behavior."
---

# Phase 1: Vitrine coerente no navegador Verification Report

**Phase Goal:** Uma pessoa percorre início, especificações e relatório no navegador e vê uma só Ranger Raptor: os mesmos fatos, as cores e a tipografia que já existem, e o nome do produto.
**Verified:** 2026-09-27T19:40:49Z
**Status:** human_needed
**Re-verification:** No — initial verification

The roadmap goal is prose. Both plans carry the equivalent user story, which validates: As a pessoa, I want to percorrer início, especificações e relatório no navegador e ver uma só Ranger Raptor, so that os fatos, as cores, a tipografia e o nome do produto sejam os mesmos nas três telas. User flow coverage below uses that story. The outcome matches the roadmap goal.

## User Flow Coverage

User story: «As a pessoa, I want to percorrer início, especificações e relatório no navegador e ver uma só Ranger Raptor, so that os fatos, as cores, a tipografia e o nome do produto sejam os mesmos nas três telas.»

| Step | Expected | Evidence | Status |
|------|----------|----------|--------|
| Open início | Four facts from the shared record, logo-only header, product name in the tab | `HeroUI.jsx` renders `homeFacts`; header is the logo button; `index.html` title `Ford Ranger Raptor` | ✓ |
| Open especificações | Same motor, power, torque, and drivetrain; competitor names and existing scores | `SpecsPage.jsx` maps `specSections` and `components` from `src/data/ranger.js` | ✓ |
| Open relatório | Same power, torque, 0-100, and competitor names; exports named for Ranger Raptor | `ReportPage.jsx` renders `highlights`, `competitors`, and sets `a.download` from `CSV_FILENAME` / `TXT_FILENAME` | ✓ |
| Outcome | One Ranger: same facts, existing colors and type, product name | Slices below all trace to `src/data/ranger.json`; screen CSS uses `src/index.css` tokens; package name, model function, title, and download names identify Ranger Raptor | ✓ |

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | Em início, especificações e relatório, potência, combustível, concorrentes e notas são os mesmos. | ✓ VERIFIED | Node import: home and spec Motor/Potência/Torque/Tração are `3.0 V6 Bi-turbo Diesel`, `397 cv @ 3.500 rpm`, `583 Nm @ 1.750-3.000 rpm`, `4x4 inteligente com baixa`. Spec `0-100 km/h` and report highlight are `5,4 segundos`. `engineData` raptor cells are 397, 583, and 5.4. Competitor names are Ranger Raptor, Hilux GR-S, Amarok V6, S10 High Country, L200 Triton. Overall score Ranger Raptor is 91. Motor explorer comparisons include hilux 65 and omit s10 and l200. Fuel `Diesel` is `engine.fuel`, shown on início and especificações inside the Motor string and the motor description (`diesel`). The report has no second fuel value. |
| 2 | Esses fatos são os de `src/data/ranger.json`; as três telas mostram as mesmas cifras. | ✓ VERIFIED | `ranger.js` is the only `ranger.json` import (`with { type: 'json' }`). `397` and `583` each occur once in the JSON. Hero, specs, and report components contain neither `397` nor `Bi-turbo` nor `Hilux GR-S`. |
| 3 | As três telas usam as cores e a tipografia já definidas em `src/index.css`. | ✓ VERIFIED | Home `.titleF` 96px/400 Bebas, `.specValue` 20px/400, `.description` 14px/400, `.eyebrow` and `.specLabel` 12px/600. Specs `.navTitle`, `.panelTitle`, `.specsRowValue` are 20px/400 Bebas. Report `.heroCardValue` is 20px/400; `.headerSub` is 12px/600 `var(--accent)`. Loader `.text` is 12px/600 and `.barFill` is `var(--accent)`. Token hexes `#f54b2e`, `#080a0e`, and `#e8e2d6` are absent from the three screen modules. `.gradeB` stays `#f54b2e` as grade encoding. |
| 4 | O cabeçalho não oferece Modelos, Configurar, Dealer nem Solicitar Proposta. | ✓ VERIFIED | `HeroUI.jsx` header has one child: the logo button, `alt="Ford"`. Ver Specs (`btnPrimary`) and Relatório (`btnSecondary`) stay in the left panel. Nav classes are gone from the home module. |
| 5 | O nome do app, o componente do modelo e os arquivos exportados identificam a Ranger Raptor. | ✓ VERIFIED | `package.json` name `ford-ranger-raptor-app`. `index.html` `lang="pt-BR"` and `<title>Ford Ranger Raptor</title>`. `FordRangerRaptor.jsx` default-exports `function FordRangerRaptor`. `CSV_FILENAME` and `TXT_FILENAME` are `ford-ranger-raptor-relatorio.csv` and `ford-ranger-raptor-relatorio.txt`, assigned to `a.download`. |
| 6 | A missing vehicle record shows Ficha da Ranger Raptor indisponível and does not fall back to literals in the screen components. | ✓ VERIFIED | `EMPTY_HEADING` is that sentence. When status is not `ok`, `homeFacts`, `specSections`, `components`, `highlights`, and `engineData` are empty arrays. Each screen renders the empty or error copy as React text and skips the fact grids. No `dangerouslySetInnerHTML`. Checked-in JSON resolves `status === 'ok'`, so this branch is present and unwired to a second fact list. |
| 7 | Ver Specs is the filled accent button. Relatório, Voltar, CSV, and TXT are not accent. The PDF control keeps an accent border and label. | ✓ VERIFIED | `.btnPrimary` is `var(--accent)` on `var(--bg)`. `.btnSecondary` does not use `var(--accent)`. `.reportBtn` and `.backBtn` use text and border tokens. `.exportBtnActive` is `var(--text-primary)` and `var(--border)`. `.exportBtnPdf` and `.exportBtnPdf.exportBtnActive` use `var(--accent)` for border and color. |
| 8 | Keyboard focus on buttons draws a 1px accent outline. The specs sheet is not reflowed. | ✓ VERIFIED | `src/index.css` `button:focus-visible { outline: 1px solid var(--accent); }`, imported from `src/main.jsx`. `.specsPanel` base rule remains `position: absolute`. |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/data/ranger.json` | Single vehicle record | ✓ VERIFIED | Exists, substantive, contains `3.0 V6 Bi-turbo`. `397` and `583` once each. |
| `src/data/ranger.js` | Formatters and screen slices | ✓ VERIFIED | Exists, exports `formatPower`, `status`, `homeFacts`, filenames, and empty copy. Wired by all three screens. Data flows from the JSON. |
| `index.html` | Document title and language | ✓ VERIFIED | `lang="pt-BR"`, title `Ford Ranger Raptor`. |
| `src/components/FordRangerRaptor.jsx` | Model component | ✓ VERIFIED | `export default function FordRangerRaptor`. No `FordF150`. |
| `src/index.css` | Tokens and focus outline | ✓ VERIFIED | `:root` tokens unchanged in role; `button:focus-visible` present; Google Fonts import kept. |
| `src/components/HeroUI.jsx` | Logo-only home header | ✓ VERIFIED | `alt="Ford"`, facts from `homeFacts`, no dead header actions. |
| `src/components/HeroUI.module.css` | Home type roles and token colors | ✓ VERIFIED | `var(--accent)` and the four type roles. |
| `src/components/SpecsPage.module.css` | Specs chrome without accent on Relatório | ✓ VERIFIED | `.reportBtn` uses `var(--text-primary)` and does not use `var(--accent)`. |

`gsd-sdk query verify.artifacts` reported 4/4 passed on each plan.

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `src/data/ranger.js` | `src/data/ranger.json` | static JSON import | ✓ WIRED | Line 1: `import record from './ranger.json' with { type: 'json' }`. SDK pattern match missed the escaped regex; the import is in the file. |
| `src/components/HeroUI.jsx` | `src/data/ranger.js` | named import of `homeFacts` and `status` | ✓ WIRED | `from '../data/ranger'`; facts render when `status === 'ok'`. |
| `src/components/SpecsPage.jsx` | `src/data/ranger.js` | named import of `specSections` and `components` | ✓ WIRED | Table and explorer map those exports. |
| `src/components/ReportPage.jsx` | `src/data/ranger.js` | `a.download` from filename constants | ✓ WIRED | `a.download = CSV_FILENAME` and `a.download = TXT_FILENAME`. SDK missed the escaped pattern. |
| `src/components/HeroUI.module.css` | `src/index.css` | `var(--accent)` and sibling tokens | ✓ WIRED | Module uses `var(--bg)`, `var(--accent)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--accent-glow)`. |
| `src/components/HeroUI.jsx` | `src/components/HeroUI.module.css` | `styles.btnPrimary` on Ver Specs | ✓ WIRED | Ver Specs keeps `styles.btnPrimary` in the left panel. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `HeroUI.jsx` | `homeFacts` | `ranger.js` formatters over `ranger.json` | Yes — four formatted strings | ✓ FLOWING |
| `SpecsPage.jsx` | `specSections`, `components` | `buildSpecSections` / `buildComponents` | Yes — overwritten rows plus copied sections; comparisons filtered by numeric scores | ✓ FLOWING |
| `ReportPage.jsx` | `highlights`, `engineData`, `competitors`, `overallScores` | same module | Yes — power, torque, 0-100, names, and score 91 | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Home, spec, report, and filename slices match the record | `node --input-type=module` import of `./src/data/ranger.js` | `OK status ok`; home values, spec rows, motor specs, competitor summary, engine raptor 397/583/5.4, filenames | ✓ PASS |
| No second copy of the reconciled literals in the screens | grep gates from the plans | hero, specs, and report literals absent; `397` and `583` counts are 1 | ✓ PASS |
| Title, model, header, focus, token hexes | grep gates | title, `FordRangerRaptor`, clean header, focus rule, screen modules free of `#f54b2e` / `#080a0e` / `#e8e2d6` | ✓ PASS |
| Production build | not re-run | Caller reported `npm run build` already passed | ? SKIP |
| Automated test suite | `npm test` | No test script in this project | ? SKIP |

### Probe Execution

No phase plan or summary declares a probe, and `scripts/*/tests/probe-*.sh` is absent. Step 7c skipped.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| DATA-01 | 01-01 | Início, especificações e relatório leem os fatos do veículo somente de `src/data/ranger.json`. | ✓ SATISFIED | Sole JSON import is `ranger.js`. Three screens import that module. |
| DATA-02 | 01-01 | Potência, combustível, concorrentes e notas são os mesmos nas três telas. | ✓ SATISFIED | Truths 1 and 2. One `engine.fuel` (`Diesel`), one competitor list, shared scores. |
| VIS-01 | 01-02 | Início, especificações e relatório usam as cores e a tipografia já definidas em `src/index.css`. | ✓ SATISFIED | Truth 3. |
| VIS-02 | 01-02 | O cabeçalho não mostra ações sem destino (Modelos, Configurar, Dealer, Solicitar Proposta). | ✓ SATISFIED | Truth 4. |
| CODE-01 | 01-01 | O nome do app, o componente do modelo e os arquivos exportados identificam a Ranger Raptor. | ✓ SATISFIED | Truth 5. |

REQUIREMENTS.md maps Phase 1 to DATA-01, DATA-02, VIS-01, VIS-02, and CODE-01. Both plans claim that same set. No orphaned phase IDs.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/App.css` | 6 | `background: #080a0e` | ℹ️ Info | Same value as `--bg`. File was outside the phase edit list. Screens still read tokens from `src/index.css`. |
| `src/components/ReportPage.jsx` | 30, 97, 266 | Chart and series hexes (`#f54b2e`, `#e8e2d6`, `#5a6478`) | ℹ️ Info | Plan 01-02 left this file and the competitor color maps unchanged. Grade and series colors stay data encoding. |
| `src/components/LoaderUI.jsx` | 14 | `react-hooks/set-state-in-effect` | ℹ️ Info | Pre-existing. Logged in `deferred-items.md`. Neither plan was allowed to edit this file. `npm run lint` still exits 1 here. |

No `TBD`, `FIXME`, or `XXX` in the phase files. No placeholder copy.

### Human Verification Required

### 1. Three screens, one Ranger

**Test:** Open the app in the browser. On início, read the four facts, the header, and the tab title. Click Ver Specs, then Relatório.
**Expected:** One Ranger Raptor. Motor `3.0 V6 Bi-turbo Diesel`, Potência `397 cv @ 3.500 rpm`, Torque `583 Nm @ 1.750-3.000 rpm`, and Tração `4x4 inteligente com baixa` on início and in the specs table. The report shows that same power, torque, `5,4 segundos`, and the names Ranger Raptor, Hilux GR-S, Amarok V6, S10 High Country, and L200 Triton. The tab title is Ford Ranger Raptor.
**Why human:** Rendered copy and navigation across the three screens are visual.

### 2. Palette, type, and focus

**Test:** On a desktop-width window, look at início, especificações, and relatório. Tab to a button.
**Expected:** Início header is the Ford logo only. Ver Specs is the filled accent button. Relatório, Voltar, CSV, and TXT are not accent. PDF keeps an accent border and label. Focus draws a 1px accent outline. Fact figures, Ranger, the description, and the loader status use the existing type roles.
**Why human:** Accent, type, and the focus ring are appearance, not a grep result.

### 3. Export filenames

**Test:** On the report, download CSV and TXT.
**Expected:** The files save as `ford-ranger-raptor-relatorio.csv` and `ford-ranger-raptor-relatorio.txt`.
**Why human:** The download attribute is set in code; the save dialog is browser behavior.

### Gaps Summary

No code gaps. Automated checks match the phase goal. A browser pass is still required for the rendered walk, the accent and type, the focus ring, and the save dialog.

---

_Verified: 2026-09-27T19:40:49Z_
_Verifier: Claude (gsd-verifier)_
