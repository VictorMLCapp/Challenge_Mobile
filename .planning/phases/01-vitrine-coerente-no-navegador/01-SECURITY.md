---
phase: 01
slug: 01-vitrine-coerente-no-navegador
status: verified
threats_open: 0
asvs_level: 1
created: 2026-09-27
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Bundled JSON → screen text | Vehicle strings cross from a repo file into React text and into a client-built CSV/TXT blob. There is no user input and no server. | Repo-authored vehicle facts and score copy |
| Download filename | The filename is a constant, not a field from the JSON. | Constant download name |
| Home header anchors | The removed Modelos, Configurar, and Dealer anchors used `href="#"`. They are chrome, not navigation. | None; anchors deleted |
| Stylesheets | Colors come from `:root` in `src/index.css`. No new remote stylesheet is added. The existing Google Fonts import stays until Phase 2 vendors the files. | Palette tokens |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-01-01 | Tampering | HeroUI, SpecsPage, ReportPage fact literals | mitigate | Screens import slices from `src/data/ranger.js` only. `397`, `Bi-turbo`, and `Hilux GR-S` appear only in `src/data/ranger.json`. No `fetch` and no runtime xlsx parse. | closed |
| T-01-02 | Tampering | React render of JSON strings | mitigate | Fact and empty-state strings render as React text children. No `dangerouslySetInnerHTML`. | closed |
| T-01-03 | Information disclosure | Score surfaces presented as Ford data | mitigate | `SCORE_DISCLAIMER` `Dados mockados para demonstração` renders on the specs explorer and the report footer, and closes the TXT. | closed |
| T-01-04 | Tampering | buildCSVContent cell join | accept | Cells are repo-authored constants, not request input. Comma-join stays. See Accepted Risks Log. | closed |
| T-01-05 | Spoofing | HeroUI header anchors `href="#"` | mitigate | Modelos, Configurar, Dealer anchors and Solicitar Proposta button are deleted. No replacement `href`. | closed |
| T-01-06 | Tampering | Hardcoded hex that copies the palette | mitigate | Screen modules use the existing tokens. `.gradeB` keeps `#f54b2e`. No new custom property or component library. | closed |
| T-01-SC | Tampering | npm/pip/cargo installs in plans 01-01 and 01-02 | accept | Neither plan installs a dependency. Fonts stay on the existing `@import`. See Accepted Risks Log. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-01-04 | Cells are repo-authored constants, not request input. This phase does not add a user field. Existing comma-join stays; CSV quoting is outside DATA-01. | 01-01-PLAN.md | 2026-09-27 |
| AR-02 | T-01-SC | Plans 01-01 and 01-02 install nothing. Fonts stay on the existing `@import` in `src/index.css`. No `@fontsource` and no Tailwind in this phase. | 01-01-PLAN.md, 01-02-PLAN.md | 2026-09-27 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-27 | 7 | 7 | 0 | gsd-security-auditor |

### Evidence

| Threat ID | Evidence |
|-----------|----------|
| T-01-01 | `HeroUI.jsx:2`, `SpecsPage.jsx:8`, `ReportPage.jsx:7-24` import `../data/ranger`. `ranger.js:1` imports `./ranger.json`. `397`, `Bi-turbo`, and `Hilux GR-S` occur only in `ranger.json:3`, `ranger.json:7`, `ranger.json:24`, `ranger.json:163`. No `fetch(` or `xlsx` in `src/data/ranger.js` or the three screen components. |
| T-01-02 | Text children: `HeroUI.jsx:39-40`, `HeroUI.jsx:47-52`; `SpecsPage.jsx:223-224`, `SpecsPage.jsx:237-242`, `SpecsPage.jsx:308-309`; `ReportPage.jsx:219-224`, `ReportPage.jsx:232`, `ReportPage.jsx:238`. No `dangerouslySetInnerHTML` or `innerHTML` in the three screen components. |
| T-01-03 | `ranger.js:8` exports `Dados mockados para demonstração`. Specs explorer: `SpecsPage.jsx:232`. Report footer: `ReportPage.jsx:463`. TXT closing line: `ReportPage.jsx:88`. |
| T-01-04 | `ReportPage.jsx:47-59` joins cells with `,`. Rows come from `engineData`, `overallScores`, and `competitors` exported by `ranger.js`. Accepted as AR-01. |
| T-01-05 | `HeroUI.jsx:17-21` header is the logo button only. No `Modelos`, `Configurar`, `Dealer`, `Solicitar Proposta`, or `href` in `HeroUI.jsx`. |
| T-01-06 | Palette hexes `#080a0e`, `#0f1318`, `#1a2030`, `#e8e2d6`, `#5a6478`, and `rgba(245, 75, 46, 0.3)` are absent from the four screen modules. Chrome uses `var(--bg)`, `var(--border)`, `var(--accent)`, `var(--text-primary)`, `var(--text-secondary)`, and `var(--accent-glow)` (for example `HeroUI.module.css:184`, `SpecsPage.module.css:91`, `ReportPage.module.css:8`, `LoaderUI.module.css:39`). `.gradeB` keeps `#f54b2e` at `ReportPage.module.css:625`. No custom-property declarations in those modules. `package.json` adds no component library. |
| T-01-SC | `package.json` dependencies are the existing React, Three, and Recharts set. No `@fontsource` and no Tailwind in the repo. `src/index.css:1` keeps the Google Fonts `@import`. Both summaries list `tech-stack.added: []`. Accepted as AR-02. |

Neither `01-01-SUMMARY.md` nor `01-02-SUMMARY.md` has a `## Threat Flags` section. No unregistered flags.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-27
