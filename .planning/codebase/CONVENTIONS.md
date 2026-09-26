# Coding Conventions

**Analysis Date:** 2026-09-26

## Naming Patterns

**Files:**
- PascalCase `.jsx` for React components: `src/components/CarViewer.jsx`, `src/components/SpecsPage.jsx`, `src/components/ReportPage.jsx`, `src/components/LoaderUI.jsx`, `src/components/HeroUI.jsx`
- Match the default-export function name to the filename. `src/components/FordRangerRaptor.jsx` exports `FordF150`; new components must not repeat that mismatch
- CSS Modules use the same stem plus `.module.css`: `src/components/HeroUI.module.css`, `src/components/SpecsPage.module.css`, `src/components/ReportPage.module.css`, `src/components/LoaderUI.module.css`
- Global CSS stays unmoduled and lives next to the shell: `src/index.css`, `src/App.css`
- App entry files stay lowercase: `src/main.jsx`, `src/App.jsx`
- Tooling config is lowercase: `eslint.config.js`, `vite.config.js`
- One-off scripts at the repo root use snake_case and are not app modules: `get_logs.cjs`, `capture_meshes.cjs`, `split_glb.py`
- No `index.js` barrels. Import the component file directly

**Functions:**
- Components are `function` declarations in PascalCase, never arrow components: `export default function SpecsPage`
- File-private helpers are camelCase `function` declarations: `buildMaterial` in `src/components/FordRangerRaptor.jsx`, `buildCSVContent` / `gradeClass` / `statusLabel` in `src/components/ReportPage.jsx`
- Named event handlers inside a component use the `handle` prefix: `handleCategory`, `handleView`, `handleComponentSelect` in `src/components/SpecsPage.jsx`
- Callback props use the `on` prefix: `onHome`, `onBack`, `onViewSpecs`, `onViewReport` in `src/App.jsx`
- One-line callbacks stay inline arrows: `onClick={() => setPage('specs')}` in `src/App.jsx`
- No `async` prefix. Async appears only in root CommonJS scripts (`get_logs.cjs`, `capture_meshes.cjs`)

**Variables:**
- camelCase for state, locals, and refs: `activeView`, `isPrintingReport`, `groupRef`
- UPPER_SNAKE_CASE for module-level data and config objects: `VIEWS`, `SPECS_DATA`, `COMPONENTS` in `src/components/SpecsPage.jsx`; `COMPETITORS`, `RADAR_DATA`, `TOOLTIP_STYLE` in `src/components/ReportPage.jsx`; `MATERIAL_MAP`, `BODY_METAL` in `src/components/FordRangerRaptor.jsx`
- Small arrays local to one component may stay camelCase: `specs` in `src/components/HeroUI.jsx`
- CSS Module import is always `styles`
- Static asset imports are camelCase: `fordLogo` from `src/assets/Ford-Logo-PNG-Isolated-Image.webp`
- No underscore prefix for “private” bindings. Privacy is “not exported”
- Page ids are string literals: `'home'`, `'specs'`, `'report'` in `src/App.jsx`
- Identifiers and comments are English. User-visible copy is Portuguese (`pt-BR`)

**Types:**
- Not applicable. The app is plain JavaScript. No TypeScript, no PropTypes, no JSDoc types
- Document a closed string set with a trailing comment when the value is a page id: `useState('home') // 'home' | 'specs' | 'report'` in `src/App.jsx`
- Shape data as plain objects and arrays. Do not introduce classes or enums

## Code Style

**Formatting:**
- No Prettier config, no `.editorconfig`, no formatter script in `package.json`
- Match the surrounding file: 2-space indent, single quotes in JavaScript, double quotes in JSX attributes
- Omit semicolons in `src/**/*.jsx` and in ESM config (`eslint.config.js`, `vite.config.js`)
- Keep semicolons in root CommonJS scripts (`get_logs.cjs`, `capture_meshes.cjs`). Do not copy that style into `src/`
- Trailing commas on multiline objects, arrays, and argument lists
- No enforced line length. Prefer wrapping long JSX props the way `src/components/ReportPage.jsx` wraps chart props
- Do not add `clsx` or `classnames`. Compose module classes with a template string: `` `${styles.explorerItem} ${active ? styles.explorerItemActive : ''}` ``
- Active-state classes are a second camelCase class with an `Active` suffix: `styles.camChildActive`, `styles.specsTabActive`, `styles.exportBtnActive`
- Static layout goes in a CSS Module. Use a `style={{ }}` object only for values that change at runtime (widths, colors, `animationDelay`)
- `src/components/CarViewer.jsx` styles its shell inline because it has no CSS Module. New UI gets a `.module.css` file instead of copying that shell

**Linting:**
- ESLint 10 flat config in `eslint.config.js`
- Extends `@eslint/js` recommended, `eslint-plugin-react-hooks` recommended, and `eslint-plugin-react-refresh` (Vite)
- Applies to `**/*.{js,jsx}`, browser globals, JSX enabled. Ignores `dist`
- No `eslint-plugin-react`, no TypeScript parser, no import-order plugin, no `no-console` rule
- Run: `npm run lint` (`eslint .`)

**CSS:**
- Global tokens live on `:root` in `src/index.css`: `--bg`, `--surface`, `--border`, `--accent`, `--text-primary`, `--text-secondary`
- Module class names are camelCase: `.logoImg`, `.btnPrimary`, `.barFill`, `.donutScore`
- Section banners in CSS use `/* ── HEADER ── */` (see `src/components/HeroUI.module.css`)
- Responsive overrides use `max-width: 700px`, then `500px` where a tighter layout exists (`src/components/HeroUI.module.css`, `src/components/ReportPage.module.css`, `src/components/SpecsPage.module.css`)
- Print rules stay in the report module: `@media print` in `src/components/ReportPage.module.css`

## Import Organization

**Order:**
1. `react` (hooks and `Suspense` in one import)
2. Third-party packages (`@react-three/fiber`, `@react-three/drei`, `three`, `recharts`)
3. Relative components (`./FordRangerRaptor`)
4. CSS: side-effect global CSS (`./App.css`) or `import styles from './X.module.css'`
5. Static assets (`../assets/...`)

**Grouping:**
- No blank line between groups. `src/components/SpecsPage.jsx` stacks imports with no separators
- No alphabetical sort and no enforced order plugin. Keep the order above when adding imports
- `src/components/SpecsPage.jsx` splits `react` into two import lines. New code uses a single `react` import
- Three.js is `import * as THREE from 'three'`
- Local JSX imports omit the extension: `import CarViewer from './components/CarViewer'` in `src/App.jsx`
- `src/main.jsx` keeps the extension on `./App.jsx`. Leave that entry import as written

**Path Aliases:**
- None. `vite.config.js` only registers `@vitejs/plugin-react`
- Use relative paths. Do not add `@/` unless the Vite config gains an alias

## Error Handling

**Patterns:**
- No `try/catch`, no custom `Error` subclasses, no React error boundary
- Fail soft in the UI: return `null` when a view should disappear (`if (!mounted) return null` in `src/components/LoaderUI.jsx`; `LoadingFallback` and `CameraController` return `null`)
- Guard effects before touching the scene: `if (!scene) return` in `src/components/FordRangerRaptor.jsx`
- Defaults use `??`, not `||`, when `0` or `''` would be valid: `MATERIAL_MAP[obj.name] ?? DEFAULT_METAL` and `cfg.roughness ?? 0.5` in `buildMaterial`
- Use `||` only for a numeric parse that should collapse `NaN`: `parseInt(u.impact, 10) || 0` in `src/components/ReportPage.jsx`
- Suspense around the GLTF model uses `fallback={null}` (`src/components/CarViewer.jsx`, `src/components/SpecsPage.jsx`). Loading UI is `LoaderUI`, driven by `useProgress`, not by the Suspense fallback
- Export actions in `exportCSV` / `exportTXT` / `exportPDF` do not catch failures. Do not add a logging wrapper around them unless the caller can show UI state
- Clear timers in the effect cleanup: `return () => clearTimeout(t)` in `src/components/HeroUI.jsx` and `src/components/LoaderUI.jsx`

**Error Types:**
- Do not throw for expected UI states (missing view, loading, unmounted overlay)
- Do not introduce a `Result` type. This codebase returns `null` or keeps the previous screen
- Root scripts (`get_logs.cjs`, `capture_meshes.cjs`, `split_glb.py`) also have no error handling. Leave them as one-off tools

## Logging

**Framework:** `console` in root scripts only. No logger in `src/`

**Patterns:**
- Do not add `console.log` to components. Nothing under `src/` logs
- Mesh inspection is a `window` hook, not a log: `window.highlightMesh` is assigned inside the `useEffect` in `src/components/FordRangerRaptor.jsx` and called from `capture_meshes.cjs`
- `get_logs.cjs` prints Puppeteer console lines that include `MESH:`
- `split_glb.py` uses `print` for asset splitting progress
- Do not add a logging dependency for UI work

## Comments

**When to Comment:**
- Section banners for large data blocks: `// ── COMPETITORS ──` and `// ── EXPORT HELPERS ──` in `src/components/ReportPage.jsx`; `// ── COMPONENT EXPLORER DATA` in `src/components/SpecsPage.jsx`
- Explain non-obvious 3D setup (scale, origin, material groups) as in the scale notes in `src/components/FordRangerRaptor.jsx`
- Mark scene regions in JSX with a short comment: `{/* Lighting */}`, `{/* Car Model */}` in `src/components/CarViewer.jsx`
- Explain a timer’s purpose: the 500ms unmount delay in `src/components/LoaderUI.jsx`
- Do not comment obvious JSX structure or restate the following line

**JSDoc/TSDoc:**
- Not used. Do not add `@param` / `@returns` blocks to components or helpers

**TODO Comments:**
- None in the repo. Do not leave `TODO` / `FIXME` markers in new code; change the code or keep the note in planning docs

## Function Design

**Size:**
- Page files own their data, helpers, and private subcomponents. `src/components/ReportPage.jsx` and `src/components/SpecsPage.jsx` are the pattern: constants at the top, helpers next, default-exported page last
- Extract a `function` in the same file when logic is pure or reused (`buildMaterial`, `buildCSVContent`, `gradeClass`, `DonutScore`, `CameraController`)
- Do not create `src/utils/` or a shared hooks folder for logic used by one page
- R3F behavior that must run every frame is a child component using `useFrame` (`CameraController` in `src/components/SpecsPage.jsx`), not a custom hook

**Parameters:**
- Destructure props in the signature: `function ReportPage({ onBack, onHome })`
- Private subcomponents take one object: `DonutScore({ score })`, `CameraController({ targetView })`, `ComponentDetailPanel({ data })`
- Module helpers take one config or no args: `buildMaterial(cfg)`, `buildCSVContent()`
- Do not add an options-object layer for a single callback

**Return Values:**
- Pages return one root element (`div` with a module class such as `styles.page`)
- Return `null` from R3F controllers and from overlays that have finished (`LoaderUI`, `CameraController`)
- Return early when toggling selection off: `handleComponentSelect` in `src/components/SpecsPage.jsx` clears `activeComponent` and returns
- Pure helpers return strings or Three.js materials. They do not touch React state
- List keys prefer a stable field (`key={c.id}`, `key={s.label}`, `key={item}`). Index keys appear where rows have no id (`key={i}` on feature and upgrade rows in `src/components/ReportPage.jsx`). Prefer an id when the row has one

## Module Design

**Exports:**
- One default export per component file: the page or viewer
- Helpers, data constants, and private subcomponents stay unexported
- `useGLTF.preload('/ford_ranger.glb')` stays at module scope after the component in `src/components/FordRangerRaptor.jsx`
- Config files default-export the tool config (`vite.config.js`, `eslint.config.js`)
- State stays in the component that renders it. `src/App.jsx` holds the page string with `useState` and passes callbacks down. No context, no store, no router

**Barrel Files:**
- Not used. Do not add `src/components/index.js`
- Import each component from its file, as `src/App.jsx` does

---

*Convention analysis: 2026-09-26*
*Update when patterns change*
