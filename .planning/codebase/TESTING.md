# Testing Patterns

**Analysis Date:** 2026-09-26

## Test Framework

**Runner:**
- Not detected. `package.json` has no test script and no test dependency
- Scripts that exist: `dev` (`vite`), `build` (`vite build`), `lint` (`eslint .`), `preview` (`vite preview`)
- No `jest.config.*`, `vitest.config.*`, Playwright config, or Cypress config

**Assertion Library:**
- Not detected. No `expect`, `assert`, `describe`, or `it` / `test` calls under `src/` or the repo root

**Run Commands:**
```bash
npm run lint                  # Only automated check (ESLint)
npm run build                 # Production bundle; fails on broken imports
npm run dev                   # Manual UI check at the Vite dev server
npm run preview               # Manual check of the production build
```

There is no watch-mode test command and no coverage command.

## Test File Organization

**Location:**
- No test files. No `*.test.*`, `*.spec.*`, `__tests__/`, or `tests/` tree
- Do not treat root scripts as the test suite. They are one-off asset and debug tools

**Naming:**
- Not applicable. Nothing in the repo uses `.test.jsx`, `.spec.jsx`, `.e2e.js`, or `.integration.js`

**Structure:**
```
src/
  main.jsx                          # entry, no test
  App.jsx                           # page switch, no test
  components/
    CarViewer.jsx                   # no colocated test
    FordRangerRaptor.jsx            # no colocated test
    HeroUI.jsx
    LoaderUI.jsx
    SpecsPage.jsx
    ReportPage.jsx
get_logs.cjs                        # Puppeteer console dump, not a test
capture_meshes.cjs                  # Puppeteer screenshot loop, not a test
split_glb.py                        # trimesh asset split, not a test
public/scratch/view.html            # static gallery of mesh screenshots
```

## Test Structure

**Suite Organization:**
```javascript
// No test suite exists. Do not invent describe/it blocks until a runner
// is added to package.json and a config file is committed.
//
// The only executable scripts are root IIFEs. They are not tests:
// get_logs.cjs, capture_meshes.cjs
```

**Patterns:**
- Setup: not used. No `beforeEach`, no test setup file, no jsdom environment
- Teardown: not used. No `afterEach`, no mock restore
- Assertions: not used. Behavior is checked by running the app
- The only automated gate that matches committed code is `npm run lint` via `eslint.config.js`
- `npm run build` is the check that imports resolve (`src/main.jsx` → `src/App.jsx` → `src/components/*`)

## Mocking

**Framework:** Not detected. No `vi.mock`, `jest.mock`, Sinon, or MSW

**Patterns:**
```javascript
// capture_meshes.cjs drives the real dev server. It is not a mock.
// It calls a debug global installed by FordRangerRaptor.jsx:
//   window.highlightMesh = (meshName) => { ... }
//
// Do not add new window.* hooks for tests. That global exists so
// capture_meshes.cjs can recolor meshes in a live page.
```

**What to Mock:**
- Nothing is mocked today. `useGLTF('/ford_ranger.glb')` in `src/components/FordRangerRaptor.jsx` loads the real asset
- `useProgress` in `src/components/LoaderUI.jsx` reads the real drei loading store
- Recharts in `src/components/ReportPage.jsx` and `src/components/SpecsPage.jsx` render real chart components
- Export helpers build real `Blob`s and click a real `<a download>` (`exportCSV`, `exportTXT` in `src/components/ReportPage.jsx`)

**What NOT to Mock:**
- Not applicable until a runner exists
- Do not mock `src/` modules from `get_logs.cjs` or `capture_meshes.cjs`. Those scripts open `http://localhost:5173` with Puppeteer and are not wired into `package.json` (Puppeteer is not a dependency)

## Fixtures and Factories

**Test Data:**
```javascript
// No factories and no tests/fixtures directory.
// Demo data is module-level constants imported by nothing but the page:
//   SPECS_DATA, COMPONENTS, VIEWS in src/components/SpecsPage.jsx
//   COMPETITORS, ENGINE_DATA, CATEGORY_GRADES,
//   UPGRADE_RECOMMENDATIONS in src/components/ReportPage.jsx
//
// ReportPage.jsx states the numbers are demonstration data
// ("Dados mockados para demonstração"). That is product copy,
// not a test fixture.
```

**Location:**
- Page data lives at the top of the component file that renders it
- Mesh screenshot names are hardcoded in `public/scratch/view.html` and `capture_meshes.cjs`
- `split_glb.py` reads `public/ford_ranger.glb` and writes `public/ford_ranger_split.glb`. It is an asset tool, not fixture setup
- No shared fixture module. Do not extract `SPECS_DATA` into a test fixture unless a test runner is added and a test imports it

## Coverage

**Requirements:** None enforced. No coverage threshold, no CI config, no `.github/` workflows

**Configuration:**
- Not detected. No c8, Istanbul, or V8 coverage block in `vite.config.js` or `package.json`
- `eslint.config.js` ignores `dist` only. It does not exclude tests because there are no tests

**View Coverage:**
```bash
# No coverage command. Use:
npm run lint
npm run build
```

## Test Types

**Unit Tests:**
- Not used
- Pure helpers that would be the first unit-test targets, if a runner is added later, already live in the page files and are not exported: `buildMaterial` in `src/components/FordRangerRaptor.jsx`; `buildCSVContent`, `buildTXTContent`, `gradeClass`, `priorityClass`, `statusLabel` in `src/components/ReportPage.jsx`
- Do not export those helpers only to test them. The current design keeps them file-private

**Integration Tests:**
- Not used
- Closest manual path: `npm run dev`, then click Home → Specs → Report. `src/App.jsx` switches on `page` (`'home' | 'specs' | 'report'`) and passes `onHome`, `onBack`, `onViewSpecs`, `onViewReport`
- Loader behavior depends on drei `useProgress` inside `src/components/LoaderUI.jsx` while `CarViewer` suspends `FordRangerRaptor`. There is no scripted check of that sequence

**E2E Tests:**
- Not used. No Playwright, Cypress, or Testing Library
- `get_logs.cjs` launches Puppeteer, listens for console text containing `MESH:`, opens `http://localhost:5173`, and closes. It asserts nothing
- `capture_meshes.cjs` sets an 800×600 viewport, calls `window.highlightMesh` for each `wire_*` name, waits 500ms, and writes PNGs. Paths in that file point at a local scratch directory, not `public/scratch/`
- `public/scratch/view.html` is a static image gallery for those mesh names. It is not an automated test
- Puppeteer is not listed in `package.json`. Do not add it as the project test runner by extending these scripts

## Common Patterns

**Async Testing:**
```javascript
// Not used in src/. Root scripts use an async IIFE and no assertions.
// get_logs.cjs:
//   const browser = await puppeteer.launch()
//   await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' })
//   await browser.close()
//
// App async work is effect + timeout, not a test helper.
// HeroUI.jsx and LoaderUI.jsx:
//   const t = setTimeout(...)
//   return () => clearTimeout(t)
```

**Error Testing:**
```javascript
// Not used. No toThrow, no rejects, no error boundary, no try/catch.
// UI absence is a null render, not a thrown error:
//   LoaderUI.jsx: if (!mounted) return null
//   CarViewer.jsx: <Suspense fallback={<LoadingFallback />}>  // LoadingFallback returns null
//   SpecsPage.jsx: <Suspense fallback={null}>
//   FordRangerRaptor.jsx: if (!scene) return
```

**Snapshot Testing:**
- Not used. No `__snapshots__/` directories
- Chart and layout checks are visual, through `npm run dev` or the print stylesheet in `src/components/ReportPage.module.css` (`@media print`, toggled when `exportPDF` sets `isPrintingReport`)

---

*Testing analysis: 2026-09-26*
*Update when test patterns change*
