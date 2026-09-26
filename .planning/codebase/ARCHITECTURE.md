<!-- refreshed: 2026-09-26 -->
# Architecture

**Analysis Date:** 2026-09-26

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    Page shell (client SPA)                   │
│  `index.html` → `src/main.jsx` → `src/App.jsx`              │
│  page state: 'home' | 'specs' | 'report'                    │
├──────────────────┬──────────────────┬───────────────────────┤
│   Home screen    │   Specs screen   │    Report screen      │
│ `HeroUI.jsx`     │ `SpecsPage.jsx`  │ `ReportPage.jsx`      │
│ `LoaderUI.jsx`   │ camera + panels  │ charts + export       │
│ `CarViewer.jsx`  │ own `<Canvas>`   │ no 3D scene           │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│              3D scene + static content modules               │
│  `src/components/FordRangerRaptor.jsx`  (GLB + materials)   │
│  module-level catalogs inside SpecsPage / ReportPage / Hero │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Static assets (no API, no database)                         │
│  `public/ford_ranger.glb`  `src/assets/`  CSS modules        │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Bootstrap | Mount React into `#root` under `StrictMode` | `src/main.jsx` |
| Page shell | Exclusive page switch (`home`, `specs`, `report`) | `src/App.jsx` |
| Home canvas | Orbit camera, lights, grid, shadows, auto-rotate | `src/components/CarViewer.jsx` |
| Vehicle model | Load GLB, scale/place it, assign PBR materials by mesh name | `src/components/FordRangerRaptor.jsx` |
| Load overlay | Full-screen progress until drei reports 100% | `src/components/LoaderUI.jsx` |
| Home chrome | Headline, teaser specs, navigation callbacks | `src/components/HeroUI.jsx` |
| Specs screen | Second canvas, animated camera, spec tabs, component explorer | `src/components/SpecsPage.jsx` |
| Camera rig | Lerp camera position and look-at each frame | `CameraController` in `src/components/SpecsPage.jsx` |
| Score donut | Recharts pie used as a 0–100 score ring | `DonutScore` in `src/components/SpecsPage.jsx` |
| Report screen | Competitive charts, feature matrix, grades, upgrades, file export | `src/components/ReportPage.jsx` |
| Global tokens | CSS variables and document reset | `src/index.css` |
| App frame | Full-viewport shell and mobile overflow override | `src/App.css` |

## Pattern Overview

**Overall:** Client-only React SPA with co-located screen components and two independent React Three Fiber canvases. No router, no server, no shared store.

**Key Characteristics:**
- One mounted screen at a time. `src/App.jsx` renders either the home stack or a full-page replacement. Leaving home unmounts the hero canvas; entering specs mounts a new canvas.
- All product, competitor, and camera data is static JavaScript constants inside the screen that displays it.
- The vehicle is a single shared mesh component (`src/components/FordRangerRaptor.jsx`) consumed by both canvases. Scene dressing (lights, grid, environment, contact shadows) is duplicated, not shared.
- Presentation and content live in the same file. There is no service, repository, or data-access layer.
- Styling is CSS Modules per screen (`*.module.css`) plus two global stylesheets.

## Layers

**Bootstrap:**
- Purpose: Attach the React tree to the DOM
- Location: `index.html`, `src/main.jsx`
- Contains: HTML shell, `createRoot`, global CSS import
- Depends on: `react-dom/client`, `src/App.jsx`, `src/index.css`
- Used by: Vite dev server and production `index.html`

**Page shell:**
- Purpose: Choose which screen is visible and pass navigation callbacks
- Location: `src/App.jsx`, `src/App.css`
- Contains: `useState('home' | 'specs' | 'report')` and conditional render
- Depends on: screen components only
- Used by: `src/main.jsx`

**Screen / overlay layer:**
- Purpose: User-facing layout, copy, and interaction for one route-equivalent view
- Location: `src/components/HeroUI.jsx`, `src/components/LoaderUI.jsx`, `src/components/SpecsPage.jsx`, `src/components/ReportPage.jsx`
- Contains: JSX, local UI state, inline catalogs, CSS Module class names
- Depends on: callbacks from `src/App.jsx`, shared model component, Recharts (specs donut and report charts), drei `useProgress` (loader)
- Used by: `src/App.jsx`

**3D scene layer:**
- Purpose: WebGL canvas, lighting, camera, and ground
- Location: `src/components/CarViewer.jsx` (home) and the `<Canvas>` block in `src/components/SpecsPage.jsx` (specs)
- Contains: `@react-three/fiber` `Canvas`, drei `Environment`, `ContactShadows`, `Grid`, and (home only) `OrbitControls`
- Depends on: `src/components/FordRangerRaptor.jsx`
- Used by: home and specs screens. Report does not mount a canvas.

**Model / material layer:**
- Purpose: Turn the GLB into a shaded, grounded vehicle
- Location: `src/components/FordRangerRaptor.jsx`
- Contains: `MATERIAL_MAP`, `buildMaterial`, `useGLTF`, scene traversal that replaces mesh materials
- Depends on: `three`, `@react-three/drei` `useGLTF`, `public/ford_ranger.glb`
- Used by: `src/components/CarViewer.jsx` and `src/components/SpecsPage.jsx`

**Static content:**
- Purpose: Spec copy, camera bookmarks, competitor scores, feature matrix, upgrade recommendations
- Location: module-level constants in `src/components/HeroUI.jsx` (`specs`), `src/components/SpecsPage.jsx` (`VIEWS`, `NAV_CATEGORIES`, `SPECS_DATA`, `COMPONENTS`), `src/components/ReportPage.jsx` (`COMPETITORS`, `RADAR_DATA`, `ENGINE_DATA`, `OVERALL_SCORES`, `FEATURES_COMPARISON`, `CATEGORY_GRADES`, `UPGRADE_RECOMMENDATIONS`, `HIGHLIGHTS`)
- Contains: plain objects and arrays, not fetched data
- Depends on: nothing
- Used by: the screen component in the same file

**Asset tooling (offline, not in the runtime graph):**
- Purpose: Split the GLB and screenshot mesh groups against a running dev server
- Location: `split_glb.py`, `capture_meshes.cjs`, `get_logs.cjs`, `replace_colors2.ps1`, `replace_colors3.ps1`
- Contains: one-off scripts
- Depends on: a local Vite server for the Puppeteer scripts; `trimesh` for the Python splitter
- Used by: manual asset work, not by `src/`

## Data Flow

### Primary Request Path

Home load and first interaction:

1. Browser loads `index.html`, which pulls the module at `/src/main.jsx` (`index.html:10`).
2. `createRoot` renders `<App />` inside `StrictMode` (`src/main.jsx:6-9`).
3. `App` initializes `page` to `'home'` and mounts `LoaderUI`, `CarViewer`, and `HeroUI` together (`src/App.jsx:10`, `src/App.jsx:14-19`).
4. `CarViewer` creates a full-viewport `<Canvas>` with a fixed camera and `OrbitControls` (`src/components/CarViewer.jsx:13-18`, `src/components/CarViewer.jsx:77-88`).
5. `Suspense` mounts `FordRangerRaptor`, which calls `useGLTF('/ford_ranger.glb')` (`src/components/FordRangerRaptor.jsx:98`). The module also preloads that URL (`src/components/FordRangerRaptor.jsx:148`).
6. On scene availability, a `useEffect` walks every mesh, enables shadows, and replaces materials from `MATERIAL_MAP` (`src/components/FordRangerRaptor.jsx:101-113`).
7. `LoaderUI` reads `useProgress()`. When `active` is false and `progress` is 100, it fades out and unmounts (`src/components/LoaderUI.jsx:7`, `src/components/LoaderUI.jsx:11-18`).
8. Hero buttons call `onViewSpecs` / `onViewReport`, which `setPage` in `App` and unmount the entire home tree (`src/components/HeroUI.jsx:57-58`, `src/App.jsx:18`).

### Specs camera and component explorer

1. `page === 'specs'` mounts `SpecsPage` and drops the home canvas (`src/App.jsx:21-23`).
2. Local state holds `activeView` (default `'geral_lateral'`), `openCategory`, `activeSection`, and `activeComponent` (`src/components/SpecsPage.jsx:287-290`).
3. A second `<Canvas>` renders the same vehicle plus `CameraController` (`src/components/SpecsPage.jsx:320-326`).
4. Choosing a nav child calls `handleView`, which sets `activeView` (`src/components/SpecsPage.jsx:299-301`). `CameraController` lerps position and look-at toward `VIEWS[activeView]` inside `useFrame` (`src/components/SpecsPage.jsx:230-241`).
5. Choosing a component sets `activeComponent` and, when `viewId` is set, jumps the camera and opens the matching category (`src/components/SpecsPage.jsx:303-314`). `ComponentDetailPanel` and `DonutScore` render that record (`src/components/SpecsPage.jsx:366`, `src/components/SpecsPage.jsx:188-218`).
6. Spec tabs index into `SPECS_DATA` (`src/components/SpecsPage.jsx:415-433`). Nothing is written back to the model.

### Report and export

1. `page === 'report'` mounts `ReportPage` with `onBack` returning to specs (`src/App.jsx:24-26`).
2. Charts read module constants (`RADAR_DATA`, `ENGINE_DATA`, `OVERALL_SCORES`) through Recharts (`src/components/ReportPage.jsx:427-501`).
3. Feature tabs set `activeCategory` and render one block of `FEATURES_COMPARISON` (`src/components/ReportPage.jsx:306`, `src/components/ReportPage.jsx:504-548`).
4. CSV and TXT export build a string, wrap it in a `Blob`, and click a temporary `<a download>` (`src/components/ReportPage.jsx:310-334`). PDF sets a print palette and calls `window.print()` (`src/components/ReportPage.jsx:336-344`, `src/components/ReportPage.jsx:346-349`).

**State Management:**
- Navigation state is one `useState` string in `src/App.jsx`. It is not in the URL, `localStorage`, or a context. Refresh always returns to home.
- Each screen owns its UI state. Specs camera, open category, spec tab, and selected component reset when `SpecsPage` unmounts. Report category and export flags reset the same way.
- The only shared mutable value outside React is `window.highlightMesh`, assigned inside the model effect (`src/components/FordRangerRaptor.jsx:115-125`). It exists for the Puppeteer capture script (`capture_meshes.cjs`).
- GLTF cache is the drei/three loader cache triggered by `useGLTF` and `useGLTF.preload('/ford_ranger.glb')`.
- No server state, no persistence, no authentication session.

## Key Abstractions

**Page:**
- Purpose: Which full screen is mounted
- Examples: `'home'`, `'specs'`, `'report'` in `src/App.jsx`
- Pattern: String state plus mutually exclusive JSX. Add a page by extending this union and rendering one component. Do not introduce a router unless the shell is changed deliberately.

**Screen component:**
- Purpose: One full view, default-exported, styled by a co-located CSS Module
- Examples: `src/components/HeroUI.jsx`, `src/components/SpecsPage.jsx`, `src/components/ReportPage.jsx`, `src/components/LoaderUI.jsx`
- Pattern: Props are navigation callbacks (`onHome`, `onBack`, `onViewSpecs`, `onViewReport`). Screens do not import `App`.

**View bookmark:**
- Purpose: Named camera pose for the specs canvas
- Examples: `VIEWS` and `NAV_CATEGORIES` in `src/components/SpecsPage.jsx`
- Pattern: Plain object `{ pos, target, label }` keyed by id. Categories list child ids. `CameraController` is the only consumer of `pos` and `target`.

**Explorable component record:**
- Purpose: A clickable vehicle part with copy, score, competitors, and an optional camera id
- Examples: `COMPONENTS` in `src/components/SpecsPage.jsx`
- Pattern: Data object rendered by the explorer list and `ComponentDetailPanel`. Selection is an id in React state, not a mesh pick on the GLB. These records are not wired to `MATERIAL_MAP` mesh names.

**Material config:**
- Purpose: Map a 3ds Max mesh name (`wire_*`) to Three.js material parameters
- Examples: `MATERIAL_MAP`, `BODY_METAL`, `buildMaterial` in `src/components/FordRangerRaptor.jsx`
- Pattern: Lookup table plus a small factory (`type: 'physical' | 'standard'`). Unknown mesh names fall through to `DEFAULT_METAL`.

**Competitor dataset:**
- Purpose: Mock comparison numbers for charts, tables, grades, and exports
- Examples: constants at the top of `src/components/ReportPage.jsx`
- Pattern: Parallel arrays/objects keyed by competitor id (`raptor`, `hilux`, `amarok`, `s10`, `l200`). Export helpers (`buildCSVContent`, `buildTXTContent`) read the same constants. Keep new metrics in those constants so charts and downloads stay aligned.

**Scene primitive:**
- Purpose: The loaded GLB placed in meters on the shared ground plane `y = -1.42`
- Examples: `<primitive>` in `src/components/FordRangerRaptor.jsx` (`scale` `0.001`, position `[0.068, -1.42, 0.446]`, yaw `Math.PI`)
- Pattern: One component, two parents. Do not fork a second model component for specs.

## Entry Points

**HTML shell:**
- Location: `index.html`
- Triggers: Browser navigation to the Vite origin
- Responsibilities: Viewport, title "Ford Vision", favicon, `#root`, module script for `src/main.jsx`

**React bootstrap:**
- Location: `src/main.jsx`
- Triggers: ES module evaluation
- Responsibilities: Import global CSS, create the root, render `App` in `StrictMode`

**Application shell:**
- Location: `src/App.jsx`
- Triggers: Render from `src/main.jsx`
- Responsibilities: Own `page` and mount exactly one screen tree

**Vite config:**
- Location: `vite.config.js`
- Triggers: `npm run dev`, `npm run build`, `npm run preview`
- Responsibilities: Enable `@vitejs/plugin-react`. No aliases, proxies, or custom public path.

**Model preload:**
- Location: `useGLTF.preload('/ford_ranger.glb')` in `src/components/FordRangerRaptor.jsx`
- Triggers: First import of the module (home canvas, or specs if home was skipped — home always imports it because `CarViewer` is imported by `App`)
- Responsibilities: Start fetching the GLB before the suspended component commits

**Offline asset scripts:**
- Location: `split_glb.py`, `capture_meshes.cjs`, `get_logs.cjs`
- Triggers: Manual execution, not npm scripts
- Responsibilities: Split `public/ford_ranger.glb` into `public/ford_ranger_split.glb`; drive `window.highlightMesh` against `http://localhost:5173`. They are not part of the user-facing runtime.

## Architectural Constraints

- **Threading:** Browser main thread. React state updates and the R3F `useFrame` loop share that thread. No Web Workers. `StrictMode` in `src/main.jsx` double-invokes effects in development, so the material traversal in `src/components/FordRangerRaptor.jsx` runs twice in dev.
- **Global state:** `window.highlightMesh` is assigned whenever the model effect runs (`src/components/FordRangerRaptor.jsx:115`). It mutates live mesh materials to debug colors and does not restore `MATERIAL_MAP`. No React context, no module-level mutable store besides that window hook and the drei GLTF cache.
- **Circular imports:** Not detected. The graph is a tree: `src/main.jsx` → `src/App.jsx` → screen components → `src/components/FordRangerRaptor.jsx`. CSS Modules and asset imports are leaves. No `index.js` barrel files.
- **Single canvas at a time:** Home and specs each construct a `<Canvas>`, but `src/App.jsx` never mounts both. Do not render both screens together without extracting a single shared canvas; two WebGL contexts on this model is not the current design.
- **Ground and scale contract:** Contact shadows and the grid sit at `y = -1.42` in both `src/components/CarViewer.jsx` and `src/components/SpecsPage.jsx`. The model primitive uses the same Y. Camera bookmarks in `VIEWS` assume that placement. Change scale or ground in all three places together.
- **Exclusive page unmount:** Switching pages destroys local state and the WebGL context. Specs camera position is not preserved across a trip to the report.
- **Static public URLs:** The runtime model path is the absolute public URL `/ford_ranger.glb`. `public/ford_ranger_grouped.glb` and `public/ford_ranger_split.glb` are not imported by `src/`.

## Anti-Patterns

### Duplicated scene rig

**What happens:** Lights, `Environment preset="city"`, `ContactShadows`, and `Grid` are copied between `src/components/CarViewer.jsx` and the canvas in `src/components/SpecsPage.jsx`.
**Why it's wrong:** Ground height, shadow bias, and lighting drift independently, so home and specs stop matching.
**Do this instead:** Keep one scene-rig component next to the canvases (same folder, `src/components/`) and pass only the camera difference: `OrbitControls` on home, `CameraController` on specs. Leave `FordRangerRaptor` as the only model child.

### Content catalogs inside view files

**What happens:** Specs copy, camera tables, and the full competitor report live as top-of-file constants in `src/components/SpecsPage.jsx` and `src/components/ReportPage.jsx`.
**Why it's wrong:** Those files mix layout with large datasets, and the same numbers (397 cv, 583 Nm, scores) are repeated in `src/components/HeroUI.jsx`, `SPECS_DATA`, `COMPONENTS`, and `ENGINE_DATA` without a single source.
**Do this instead:** When a fact is shown on more than one screen, move that constant to a shared module imported by both screens. Until a second importer exists, keep the constant at the top of the owning screen file so the current co-location pattern stays intact.

### Debug hook left on the live model

**What happens:** The material effect publishes `window.highlightMesh`, which replaces PBR materials with `MeshBasicMaterial` (`src/components/FordRangerRaptor.jsx:115-125`).
**Why it's wrong:** Any caller can permanently recolor the vehicle for the rest of the session. The Puppeteer script `capture_meshes.cjs` depends on that global.
**Do this instead:** Keep material assignment inside the effect from `MATERIAL_MAP` only. Drive mesh highlighting from a prop or a dev-only script, and restore the previous material when the highlight ends.

### Default export name disagrees with the file

**What happens:** `src/components/FordRangerRaptor.jsx` default-exports a function named `FordF150`. Call sites import it as `FordRangerRaptor`.
**Why it's wrong:** Stack traces and searches for the component name miss the declaration.
**Do this instead:** Name the default function `FordRangerRaptor` to match the filename and the import sites in `src/components/CarViewer.jsx` and `src/components/SpecsPage.jsx`.

## Error Handling

**Strategy:** No application error boundary and no `try/catch`. Failures surface as React render errors or a WebGL canvas that never finishes loading.

**Patterns:**
- GLB loading is wrapped in `<Suspense>`. The home fallback renders `null` (`LoadingFallback` in `src/components/CarViewer.jsx`). The specs fallback is `fallback={null}` (`src/components/SpecsPage.jsx`). The user-visible wait state is `LoaderUI`, which only reacts to drei progress, not to a rejected load.
- Unknown mesh names use `DEFAULT_METAL` (`src/components/FordRangerRaptor.jsx:110`). They do not throw.
- Export actions in `src/components/ReportPage.jsx` assume `Blob`, object URLs, and `window.print()` succeed. `exporting` is cleared on a timeout, not on failure.
- `LoaderUI` treats "not active and progress === 100" as success, including a warm cache (`src/components/LoaderUI.jsx:13`).

## Cross-Cutting Concerns

**Logging:** No logger in `src/`. `get_logs.cjs` listens for browser console lines containing `MESH:` against the dev server. Do not add `console.log` mesh dumps to the model component for production paths.

**Validation:** Not detected. Props are untyped JSX. Page ids and view ids are unchecked strings. `VIEWS[activeView]` is indexed directly in `src/components/SpecsPage.jsx`.

**Authentication:** Not applicable. No login, tokens, or protected routes.

**Styling:** Design tokens live on `:root` in `src/index.css` (`--bg`, `--accent`, `--text-primary`, and related). Screen layout uses CSS Modules (`HeroUI.module.css`, `LoaderUI.module.css`, `SpecsPage.module.css`, `ReportPage.module.css`). `CarViewer` positions its canvas with an inline style. Accent `#f54b2e` is both the CSS token and hardcoded chart colors in `src/components/ReportPage.jsx` and `DonutScore`.

**Print:** `ReportPage` swaps `SCREEN_COMPETITOR_COLORS` for `PRINT_COMPETITOR_COLORS` while `exporting === 'pdf'` or `isPrintingReport` is set (`src/components/ReportPage.jsx:346-349`). PDF output is the browser print dialog, not a generated PDF library.

**Responsive shell:** Below 700px, `src/App.css` and `src/index.css` switch the document from a locked viewport to scrollable height. Screens still assume a desktop overlay layout.

---

*Architecture analysis: 2026-09-26*
