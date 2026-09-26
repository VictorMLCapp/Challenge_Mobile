# Codebase Concerns

**Analysis Date:** 2026-09-26

## Tech Debt

**Opaque mesh IDs instead of the grouped model:**
- Issue: Materials are assigned by 3ds Max wireframe ids (`wire_134110008` and nine siblings) on `public/ford_ranger.glb` (10 meshes, 0 embedded images, 1 source material). A cleaner asset already exists: `public/ford_ranger_grouped.glb` (meshes `Body`, `Wheels`, `Interior`, `Roof`, 7.0 MB) and is never loaded.
- Files: `src/components/FordRangerRaptor.jsx`, `public/ford_ranger.glb`, `public/ford_ranger_grouped.glb`
- Why: Meshes were identified by color id (see `MATERIAL_MAP` comments and `capture_meshes.cjs` / `public/scratch/view.html`), then painted with synthetic PBR materials. The grouped export was left beside the wired model.
- Impact: Any GLB re-export that renames a mesh silently falls through to `DEFAULT_METAL` (metallic black body). Glass, tires, and lights cannot be retargeted without editing the id table. Part-level UI in `src/components/SpecsPage.jsx` cannot bind to a real mesh.
- Fix approach: Load `public/ford_ranger_grouped.glb` (or a Draco/meshopt-compressed GLB with semantic names). Key `MATERIAL_MAP` by those names. Delete the wire-id table once every grouped mesh has a material.

**Glass forced to opaque body metal:**
- Issue: Mesh `wire_087224198` is assigned `BODY_METAL` with the comment "glass → same metallic body (no transparency)". `MeshPhysicalMaterial` supports `transmission`, but every physical config leaves it at 0.
- Files: `src/components/FordRangerRaptor.jsx`
- Why: Transparency was turned off so the cabin reads as solid metal under the current lighting.
- Impact: Windows, headlights, and the interior read as the same black clearcoat. Specs copy in `src/components/SpecsPage.jsx` describes LED matrix lamps and a cockpit that the model cannot show.
- Fix approach: Give glass its own physical material (`transmission`, `thickness`, `roughness`) and keep `wire_229166215` as an emissive lens. Do not reuse `BODY_METAL` for either.

**Exported component is still named FordF150:**
- Issue: `export default function FordF150()` lives in `src/components/FordRangerRaptor.jsx`. Call sites import it as `FordRangerRaptor`. CSV/TXT downloads are named `ford-srv-smart-report-view.csv` and `ford-srv-smart-report-view.txt`.
- Files: `src/components/FordRangerRaptor.jsx`, `src/components/CarViewer.jsx`, `src/components/SpecsPage.jsx`, `src/components/ReportPage.jsx`
- Why: The product name changed in the UI while the function and download slugs stayed on earlier names.
- Impact: Search, stack traces, and downloaded files do not match "Ranger Raptor" / "Ford Vision".
- Fix approach: Rename the function to `FordRangerRaptor`. Name downloads `ford-ranger-raptor-report.csv` and `.txt`.

**Two copies of the WebGL scene:**
- Issue: Lighting, `Environment preset="city"`, `ContactShadows`, and `Grid` are duplicated. Home adds a second shadow-casting `spotLight` and `OrbitControls`. Specs replaces controls with `CameraController`.
- Files: `src/components/CarViewer.jsx`, `src/components/SpecsPage.jsx`
- Why: The specs view was added as a second page instead of a mode of the existing canvas.
- Impact: A lighting or ground-plane change must be edited twice. Home and specs can drift (they already do: only home casts a spot shadow).
- Fix approach: Extract one `VehicleStage` used by both pages. Pass `mode="orbit" | "scripted"` and the active camera preset.

**Vehicle facts are copied in four places:**
- Issue: Power, torque, and drivetrain are hardcoded separately. Hero says `3.0 V6 Bi-turbo` (no fuel). Specs say `3.0 V6 Bi-turbo Diesel` and `397 cv @ 3.500 rpm`. The report repeats `397` / `583` / `5.4` inside `ENGINE_DATA`, `HIGHLIGHTS`, and `RADAR_DATA`. Scores in `COMPONENTS` (6 parts, 3 rivals) do not include S10 or L200, which the report does.
- Files: `src/components/HeroUI.jsx`, `src/components/SpecsPage.jsx`, `src/components/ReportPage.jsx`, `FIAP-Ford - Data sheet_Desafio_01_v02.xlsx` (499 KB, not imported)
- Why: Each screen was authored with its own const arrays. The spreadsheet is not read by the app.
- Impact: A correction in one screen leaves the others wrong. The report footer admits "Dados mockados" while hero and specs present the same numbers as product facts.
- Fix approach: One module, e.g. `src/data/ranger.js`, fed by the spreadsheet (or a checked-in JSON export of it). Hero, specs, and report import that module only.

**Page switches throw the canvas away:**
- Issue: `page` state in `App` mounts exactly one of home, specs, or report. Leaving home unmounts the `Canvas`. Coming back mounts a new WebGL context on the same cached `useGLTF` scene.
- Files: `src/App.jsx`, `src/main.jsx`, `src/components/FordRangerRaptor.jsx`
- Why: Navigation is a single `useState` with no router and no persistent viewer.
- Impact: Every specs visit creates and destroys a context. `buildMaterial()` allocates new `THREE.Material`s and never calls `dispose()`. The cached scene from `useGLTF` / `useGLTF.preload('/ford_ranger.glb')` is mutated in place, so those materials accumulate on the shared object.
- Fix approach: Keep one `Canvas` mounted and swap HTML overlays. On material swap, `dispose()` the previous material. Clone the scene (`scene.clone()`) per mount if two views must exist, so the GLTF cache stays pristine.

**Debug hook left on the production model:**
- Issue: `window.highlightMesh` replaces every `wire_*` material with `MeshBasicMaterial` (red for the match, 50% gray for the rest) and never restores PBR materials or disposes the previous ones.
- Files: `src/components/FordRangerRaptor.jsx`, `capture_meshes.cjs`, `public/scratch/view.html`
- Why: `capture_meshes.cjs` drives the hook with Puppeteer to screenshot each mesh into `public/scratch/`.
- Impact: Any caller (devtools, the script) permanently flattens the vehicle until a full reload. The global is reassigned on every effect run.
- Fix approach: Remove `window.highlightMesh` from the component. Keep mesh capture as a dev-only script that is not imported by `src/`.

**Tooling scripts are one-off and undeclared:**
- Issue: `capture_meshes.cjs` and `get_logs.cjs` `require('puppeteer')`, which is not in `package.json`. They hardcode `http://localhost:5173` and a Windows path under `C:/Users/artur/.gemini/...`. `split_glb.py` imports `trimesh` with no `requirements.txt` and writes `public/ford_ranger_split.glb`. `replace_colors2.ps1` and `replace_colors3.ps1` rewrite `src/` in place from `C:\Users\artur\Desktop\Challenge_Mobile`.
- Files: `capture_meshes.cjs`, `get_logs.cjs`, `split_glb.py`, `replace_colors2.ps1`, `replace_colors3.ps1`, `package.json`
- Why: Local mesh-identification and color-replace passes were committed next to the app.
- Impact: `node capture_meshes.cjs` fails without a global Puppeteer. Re-running the PowerShell scripts from the wrong machine edits nothing or the wrong tree. `split_glb.py` can regenerate a 7,529-mesh GLB (12 MB) into `public/`.
- Fix approach: Move scripts to `scripts/`, document installs, or delete them if mesh capture is finished. Do not leave them at the repo root.

**README is the Vite starter:**
- Issue: `README.md` still describes the React + Vite template, Oxc, and the React Compiler. It does not mention Ford Vision, the GLB, or the three pages.
- Files: `README.md`, `package.json`, `vite.config.js`
- Why: The app was built on `create-vite` and the starter text was not replaced.
- Impact: Setup instructions omit the 9.2 MB model, the remote HDRI, and the fact that there is no test script.
- Fix approach: Replace `README.md` with run, build, and asset notes for this app.

## Known Bugs

**Report "Voltar" always opens specs:**
- Symptoms: From the report, back navigation lands on specifications even when the report was opened from home.
- Files: `src/App.jsx` (`onBack={() => setPage('specs')}`), `src/components/HeroUI.jsx` (`onViewReport`), `src/components/ReportPage.jsx`
- Trigger: Home → Relatório → ← Voltar.
- Workaround: The Ford logo calls `onHome` and returns to the hero.
- Root cause: Report has a single back target. Specs correctly returns home (`onBack={() => setPage('home')}`); report does not record the previous page.

**PDF export prints before print colors commit:**
- Symptoms: "PDF" calls `window.print()` in the same turn as `setIsPrintingReport(true)`. React has not re-rendered, so chart fills still use `SCREEN_COMPETITOR_COLORS` (desaturated rivals). The dialog can also outlive the 2 s timeout that clears print mode.
- Files: `src/components/ReportPage.jsx` (`exportPDF`), `src/components/ReportPage.module.css` (`@media print`)
- Trigger: Relatório → PDF.
- Workaround: The browser print stylesheet still forces a white page background. Inline SVG `fill` from Recharts does not follow that stylesheet.
- Root cause: `setState` is asynchronous; `window.print()` is synchronous. There is no `afterprint` listener. `@media print` cannot replace inline series colors.

**CSV score block is five broken rows:**
- Symptoms: `buildCSVContent()` pushes one row per `OVERALL_SCORES` entry, each labeled `Score`, with the number in whichever competitor column matches `name.includes(firstWord)`. Other columns are empty. Feature flags and category grades are omitted. The file has no UTF-8 BOM, so Excel often misreads "Especificação".
- Files: `src/components/ReportPage.jsx` (`buildCSVContent`, `exportCSV`)
- Trigger: Relatório → CSV, open in Excel.
- Workaround: The TXT export lists rank and category grades in a single readable block.
- Root cause: Score matching is substring-based and row-oriented. Engine rows are fine; the score section is not a single aligned record.

**Spec bar chart hides the metrics that are not on the 1000-scale:**
- Symptoms: One `BarChart` plots potência (cv), torque (Nm), 0–100 (seconds), suspension course (mm), and payload (kg) on a shared Y axis. Payload peaks at 1100 (`l200`), so the 5.4–9.8 s bars are a few pixels. Lower-is-better 0–100 is drawn as a taller-is-better bar.
- Files: `src/components/ReportPage.jsx` (`ENGINE_DATA`, the "Especificações Técnicas" `BarChart`)
- Trigger: Open Relatório and read the middle chart.
- Workaround: The hero strip and the feature table state 0–100 and course as text.
- Root cause: Heterogeneous units share one axis and one "higher bar is better" encoding.

**Projected score does not match the listed impacts:**
- Symptoms: The upgrade cards sum to +26 (`+6 +8 +5 +4 +3`). The badge shows `99/100` and `+8 pts com todos os upgrades`.
- Files: `src/components/ReportPage.jsx` (`projectedScore`, `UPGRADE_RECOMMENDATIONS`)
- Trigger: Relatório → Upgrades Recomendados.
- Workaround: Add the `impact` strings on the cards by hand.
- Root cause: `Math.min(99, 91 + sum(parseInt(impact)))` clamps 117 to 99, then the label prints `projectedScore - 91`.

**Loader covers the hero again after the model is cached:**
- Symptoms: Returning to home paints a full-screen blur (`z-index: 1000`, opacity 1) and only then fades it out, because `mounted` and `opacity` always start at the loading state.
- Files: `src/components/LoaderUI.jsx`, `src/components/LoaderUI.module.css`, `src/App.jsx`
- Trigger: Home → Ver Specs → ← Voltar. Also a failed or stalled load (GLB or HDRI): `progress === 100 && !active` never becomes true, so the overlay stays and blocks every control.
- Workaround: Reload once the GLB is cached; if the overlay sticks, the network request for `/ford_ranger.glb` or the environment HDRI has not finished.
- Root cause: Dismissal is tied to a single success condition. There is no error flag, timeout, or "already loaded" initial state. `LoadingFallback` in `src/components/CarViewer.jsx` returns `null`.

**Hero navigation does nothing:**
- Symptoms: "Modelos", "Configurar", and "Dealer" are `<a href="#">`. "Solicitar Proposta" is a `<button>` with no `onClick`. On viewports `≤ 700px` the three links are `display: none`; at `≤ 500px` the proposal button is hidden too.
- Files: `src/components/HeroUI.jsx`, `src/components/HeroUI.module.css`
- Trigger: Click any of those four controls on a desktop-width window.
- Workaround: "Ver Specs" and "Relatório" are the only wired actions.
- Root cause: The header was styled as a marketing nav and never given routes.

**Current camera name is not shown:**
- Symptoms: `SpecsPage` renders `VIEWS[activeView].label` inside `.viewLabel`. The class is `display: none` at every breakpoint, including the base rule.
- Files: `src/components/SpecsPage.jsx`, `src/components/SpecsPage.module.css` (`.viewLabel`)
- Trigger: Specs → any camera preset (Frente, Motor, Caçamba, …).
- Workaround: The left-hand preset button stays in the active style.
- Root cause: The overlay node exists and the CSS suppresses it.

**Specs layout stacks the bottom panel on top of the explorer on small screens:**
- Symptoms: At `max-width: 700px`, `.page` becomes a column and `.canvas` / `.componentExplorer` are in normal flow, but `.specsPanel` stays `position: absolute; bottom: 0` and `.componentExplorer` uses `bottom: 200px` only on desktop. The spec table anchors to the bottom of the whole column and covers the explorer.
- Files: `src/components/SpecsPage.module.css` (`.specsPanel`, `.componentExplorer`, the `700px` block)
- Trigger: Open specs at a viewport width of 700px or below.
- Workaround: None in the UI. Desktop widths keep the explorer in the right column above the panel.
- Root cause: The mobile pass changed canvas and explorer to in-flow layout and left the spec sheet absolutely positioned against `.page`.

## Security Considerations

**Runtime requests to third parties with no CSP:**
- Risk: `Environment preset="city"` (drei) downloads an HDRI at runtime. `src/index.css` loads Inter and Bebas Neue with `@import` from `fonts.googleapis.com`. There is no Content-Security-Policy. A blocked or replaced response changes lighting or fonts; a failed HDRI also feeds the loader bug above.
- Files: `src/components/CarViewer.jsx`, `src/components/SpecsPage.jsx`, `src/index.css`, `index.html`, `vite.config.js`
- Current mitigation: None. The GLB itself is same-origin (`/ford_ranger.glb`). No API keys or `.env` files are present.
- Recommendations: Vendor the HDRI and the font files under `public/` or `src/assets/`. Add a CSP that allows only self. Keep `Environment` on a local file path.

**Debug global can rewrite the scene:**
- Risk: `window.highlightMesh` is reachable from any script on the page and replaces materials on the shared GLTF scene. There is no restore path.
- Files: `src/components/FordRangerRaptor.jsx`
- Current mitigation: The function only changes materials. It does not read storage, network, or credentials. The app has no accounts and no server.
- Recommendations: Delete the assignment. Do not attach dev helpers to `window` in `src/`.

**`public/` is served in full, including scratch captures:**
- Risk: Vite copies all of `public/` into the build. That includes `public/scratch/*.png`, `public/scratch/view.html`, unused GLBs, and loose textures. Nothing in that tree is a secret; it is still extra attack surface and a 36 MB publish of work files (measured: `public/` is 37,383,680 bytes).
- Files: `public/scratch/`, `public/ford_ranger_split.glb`, `public/ford_ranger_grouped.glb`, `public/textures/`, `vite.config.js`
- Current mitigation: `package.json` marks the package `"private": true`. No auth tokens are embedded.
- Recommendations: Keep only `public/ford_ranger.glb` (or its replacement) plus favicons. Put scratch shots outside `public/`.

**Mock scores are presented with a Ford copyright line:**
- Risk: `ReportPage` footer renders `© {year} Ford Motor Company` and the TXT export ends with the same line, while the body says the numbers are mock. Hero and specs have no equivalent disclaimer. The logo file is `src/assets/Ford-Logo-PNG-Isolated-Image.webp`.
- Files: `src/components/ReportPage.jsx`, `src/components/HeroUI.jsx`, `src/components/SpecsPage.jsx`, `src/assets/Ford-Logo-PNG-Isolated-Image.webp`
- Current mitigation: One footer sentence and one TXT line: "Dados mockados para demonstração".
- Recommendations: Show that sentence on every page that displays scores. Keep trademarked assets limited to what the challenge brief allows.

## Performance Bottlenecks

**First load pulls a 9.2 MB uncompressed GLB plus a remote HDRI:**
- Problem: The only model the app loads is `public/ford_ranger.glb` at 9,584,260 bytes, with 10 meshes and no textures. `Environment preset="city"` then fetches a separate HDRI. `useGLTF.preload` starts that download as soon as `FordRangerRaptor.jsx` is evaluated, and `src/App.jsx` imports specs and report statically, so Recharts is in the same initial graph as Three.
- Files: `public/ford_ranger.glb`, `src/components/FordRangerRaptor.jsx`, `src/App.jsx`, `src/components/ReportPage.jsx`, `package.json`
- Measurement: GLB 9.2 MB on disk. `public/` total 36 MB. No runtime p95 was captured (no dev server profile in this audit). Vite config has no `manualChunks`, no gzip/brotli plugin, and no `build.rollupOptions`.
- Cause: The mesh is stored as a raw GLB. Page modules are eager. The HDRI is a second network round trip.
- Improvement path: `React.lazy` for `SpecsPage` and `ReportPage`. Compress the GLB (Draco or meshopt) and cap `dpr` at `[1, 1.5]` on the `Canvas`. Self-host a 1K HDRI.

**Unused binaries are still published:**
- Problem: Files the renderer never references still sit in `public/`, so a static host will serve them if requested and they inflate the repo (git pack is 16.42 MiB).
- Files: `public/ford_ranger_grouped.glb` (7,287,644 bytes, unused), `public/ford_ranger_split.glb` (12,407,240 bytes, 7,529 meshes), `public/textures/` (6.4 MB: `Leather_BL_r.jpg` 2.2 MB, `Tires_bm.jpg` 1.5 MB, and seven other maps), `public/scratch/` (1.3 MB), `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png`, `src/assets/Frame 1.png` (no imports under `src/`)
- Measurement: Unused `public/` payload is about 27 MB (36 MB total minus the 9.2 MB live GLB and small favicons).
- Cause: Extraction and split experiments were written into `public/`. `FordRangerRaptor.jsx` replaces materials in code and never samples `public/textures/`.
- Improvement path: Delete or move unused files out of `public/` before `vite build`. If the grouped GLB becomes the source model, drop `ford_ranger.glb` and the loose textures that are not assigned as maps.

**Home canvas is a heavy mobile frame:**
- Problem: The home view enables antialiasing, a 2048×2048 shadow map, two shadow-casting lights (`directionalLight` and `spotLight`), `ContactShadows`, an infinite `Grid`, and `autoRotate`. Specs repeats the 2048 shadow map, contact shadows, grid, and environment, without orbit.
- Files: `src/components/CarViewer.jsx`, `src/components/SpecsPage.jsx`
- Measurement: Shadow map is set to `[2048, 2048]` in both canvases. Runtime frame time was not measured.
- Cause: Several full-screen passes (main color, shadow, contact shadow) run every frame while the camera auto-rotates (`autoRotateSpeed={0.5}`), so the GPU never idles on the hero.
- Improvement path: One shadow-casting light, shadow map 1024 or off on viewports under 700px, `dpr={[1, 1.5]}`, and pause `autoRotate` when `document.hidden` or when the user is on specs. Reuse a single canvas so navigation does not re-upload the GLB to the GPU.

## Fragile Areas

**Shared GLTF scene plus StrictMode:**
- Files: `src/components/FordRangerRaptor.jsx`, `src/main.jsx`
- Why fragile: `useGLTF` caches one `scene`. The effect writes `obj.material` and `castShadow` onto that object. `StrictMode` mounts twice in development. `<primitive object={scene}>` cannot attach the same `Object3D` to two parents if two pages ever mount together.
- Common failures: Materials leak or reset after navigation. A future layout that shows hero and specs together throws a Three "object already has a parent" error.
- Safe modification: Clone before mutating. Dispose materials in the effect cleanup. Change `MATERIAL_MAP` and the GLB in the same change. Do not mount two `<FordRangerRaptor />` instances.
- Test coverage: None. No test runner is configured.

**`CameraController` owns the camera every frame:**
- Files: `src/components/SpecsPage.jsx` (`CameraController`, `VIEWS`)
- Why fragile: `useFrame` lerps position and calls `camera.lookAt` continuously (factor `0.04`). Preset coordinates are hand-written (`motor_hood`, `caçamba`, `cockpit`, …). The GLB has no separate hood, lamp, or bed mesh, so those presets only move the camera around the same 10-mesh shell. There is no `OrbitControls` on this page, so a bad preset cannot be corrected by dragging.
- Common failures: A scale or `position` tweak in `FordRangerRaptor.jsx` (`scale={0.001}`, `position={[0.068, -1.42, 0.446]}`, `rotation={[0, Math.PI, 0]}`) makes every preset miss the vehicle. Comments in that file still argue with the scale choice.
- Safe modification: Derive presets from `Box3` of the cloned scene after scale is applied. Keep the ground Y (`-1.42`) in one constant shared with `ContactShadows` and `Grid`.
- Test coverage: None. Preset changes are visual only.

**Report data and export helpers are one module:**
- Files: `src/components/ReportPage.jsx` (641 lines), `src/components/ReportPage.module.css` (1,385 lines)
- Why fragile: Competitors, radar, engine rows, feature flags, grades, and upgrades are parallel structures that must stay column-aligned (`raptor`, `hilux`, `amarok`, `s10`, `l200`). `COMPETITOR_NAMES` is derived from `COMPETITORS`, but `RADAR_DATA` uses a different key casing (`Raptor` vs `raptor`). Print colors and screen colors are two maps switched by React state during `window.print()`.
- Common failures: Adding a rival requires edits in `COMPETITORS`, `RADAR_DATA`, `ENGINE_DATA`, `OVERALL_SCORES`, every `FEATURES_COMPARISON` row, and the fill ternary that matches `score.name.includes('Hilux')`.
- Safe modification: Add a rival in one array and derive radar keys, bar `dataKey`s, feature columns, and colors from it. Trigger print from `useEffect` after `isPrintingReport` is true, and clear it on `window` `afterprint`.
- Test coverage: None. CSV shape, score clamp, and print ordering are untested.

**Responsive shells duplicate three breakpoints:**
- Files: `src/index.css`, `src/App.css`, `src/components/HeroUI.module.css`, `src/components/SpecsPage.module.css`, `src/components/ReportPage.module.css`
- Why fragile: `700px` and `500px` are copied per page. `html, body, #root` switch from `overflow: hidden` to `overflow: auto` at 700px while several children stay `position: absolute; inset: 0`. Specs then mixes in-flow and absolute regions (see the layout bug above).
- Common failures: A new overlay with `inset: 0` looks correct on desktop and slides over scrolling content on a phone. Print CSS in `ReportPage.module.css` uses `:root`, `html`, and `body` from inside a CSS module; those selectors are global and also affect the hero if both are mounted. Today only one page mounts, so the leak is latent.
- Safe modification: Change breakpoints in one shared file. Prefer one scrolling document on small screens and keep the canvas at a fixed `vh`. Scope print rules under a page class.
- Test coverage: None. No screenshot or viewport test.

## Scaling Limits

**Static client only:**
- Current capacity: One browser tab. No API, database, cache, or session. Concurrent users are limited by whoever hosts the static files. The live model is 9,584,260 bytes before the HDRI and the JS bundle.
- Limit: Mobile networks and GPUs. A cold load transfers the full GLB with no compression plugin in `vite.config.js`. The home frame keeps a 2048 shadow map, contact shadows, and auto-rotate active for the whole visit. `public/ford_ranger_split.glb` (7,529 meshes) is not on the render path; loading it would exhaust a phone GPU.
- Symptoms at limit: Loader stays up on slow links. Fans spin and the tab drops frames on integrated GPUs. Hosts that upload all of `public/` transfer ~36 MB of binaries even though the app requests one GLB.
- Scaling path: This app does not need a server to grow. Compress and cache the GLB, code-split Recharts, cap pixel ratio and shadows, and stop publishing unused files. A CDN with `Cache-Control` on `/ford_ranger.glb` is the hosting step.

**In-memory page state:**
- Current capacity: Three pages in one `useState` (`'home' | 'specs' | 'report'`). Refresh, shared links, and the browser back button all return to home because the URL never changes.
- Limit: Any new page or deep link has to be another conditional in `src/App.jsx`.
- Symptoms at limit: Users cannot bookmark Relatório. Back from the report does not match browser history (it forces specs).
- Scaling path: Add a router (`/`, `/specs`, `/report`) and keep the canvas above the route outlet if the viewer should survive navigation.

## Dependencies at Risk

**`puppeteer` and `trimesh` are imported but not declared:**
- Risk: `capture_meshes.cjs` and `get_logs.cjs` call `require('puppeteer')`. `split_glb.py` imports `trimesh`. Neither dependency is listed. Puppeteer is a CommonJS require in an `"type": "module"` package.
- Impact: Fresh clones cannot run mesh capture or the GLB split. A later cleanup that "installs what the scripts need" pulls a browser-automation toolchain into a frontend app.
- Migration plan: Delete the scripts or move them to `scripts/` with their own `package.json` / `requirements.txt`, and keep them out of the Vite graph.

**Remote HDRI and Google Fonts:**
- Risk: `@react-three/drei` environment presets and the CSS `@import` in `src/index.css` depend on third-party hosts. Versions in `package.json` are `@react-three/drei` `^10.7.7`, `three` `^0.184.0`, `@react-three/fiber` `^9.6.1`. A preset URL change in a minor drei bump breaks lighting without a local asset diff.
- Impact: Offline, locked-down networks, and font outages degrade the hero. The loader can stall when the HDRI never finishes.
- Migration plan: Pin drei and three to exact versions when the look is signed off. Commit the HDRI and the two font files. Point `Environment` at the local file.

**Recharts is tied to the report monolith:**
- Risk: `recharts` `^3.8.1` is imported at the top of `src/components/ReportPage.jsx` (radar, bar, radial) and `src/components/SpecsPage.jsx` (`PieChart` for a 90×90 donut). Both are statically imported from `src/App.jsx`.
- Impact: The home page downloads chart code it does not render. A Recharts major bump touches every chart in the 641-line report file.
- Migration plan: Lazy-load both pages. Replace `DonutScore` with a small SVG so specs does not need Recharts. Keep Recharts only behind the report route.

**No CI and a stock ESLint config:**
- Risk: `eslint.config.js` applies recommended JS plus `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`. It does not typecheck (the app is JSX, no `tsconfig`). `package.json` has `dev`, `build`, `lint`, and `preview` — no `test`. No `.github/` workflow.
- Impact: The bugs in this document (CSV rows, print timing, back target, dead `.viewLabel`) are not gated.
- Migration plan: Add a test script and a workflow that runs `npm run lint` and the tests on push. TypeScript is optional; tests around `src/data` and the export helpers pay off first.

## Missing Critical Features

**No real data source:**
- Problem: Competitive figures, grades, and upgrade impacts are literals. `FIAP-Ford - Data sheet_Desafio_01_v02.xlsx` is in the repo root and is never parsed.
- Current workaround: Edit the consts in `src/components/ReportPage.jsx` and mirror them in `src/components/HeroUI.jsx` and `src/components/SpecsPage.jsx`.
- Blocks: A corrected brief cannot flow into the UI. Hero, specs, and report can disagree (fuel type already does).
- Implementation complexity: Low for a JSON module checked in from the sheet. Medium if the xlsx must be parsed in the browser.

**No part selection on the model:**
- Problem: The specs explorer (`COMPONENTS` in `src/components/SpecsPage.jsx`) only calls `setActiveView`. It does not highlight a mesh. The loaded GLB cannot isolate a headlamp, mirror, or bed (`wire_*` groups are whole color regions). `window.highlightMesh` is the only highlighter and it destroys materials.
- Current workaround: Camera presets approximate "Motor", "Rodas", and "Caçamba".
- Blocks: "Selecione para ver specs" does not show the part on the vehicle. Glass and lamps stay body-colored, so the preset for "Faróis LED Matrix" has nothing distinct to frame.
- Implementation complexity: Medium once `ford_ranger_grouped.glb` (or a further split that stays well under 7,529 meshes) is the loaded asset and materials can be swapped per named mesh with dispose.

**No routes, no WebGL fallback, no real PDF:**
- Problem: URL state does not exist. There is no React error boundary around `Canvas`. PDF is the print dialog, not a file. Proposal, models, configure, and dealer controls are inert.
- Current workaround: Logo button returns home. Users print from the browser. Dead header controls are hidden under 500px.
- Blocks: Shareable report links, a controlled failure when WebGL is unavailable, and a PDF that matches `PRINT_COMPETITOR_COLORS`.
- Implementation complexity: Low for a router and an error boundary. Low to fix print ordering with `useEffect` + `afterprint`. Medium for a generated PDF if print layout is not enough.

## Test Coverage Gaps

**Entire application:**
- What's not tested: No `*.test.*` or `*.spec.*` files. `package.json` has no test script. Nothing covers page transitions, material assignment, CSV/TXT builders, the projected-score clamp, or loader dismissal.
- Files: `src/App.jsx`, `src/components/FordRangerRaptor.jsx`, `src/components/ReportPage.jsx`, `src/components/LoaderUI.jsx`, `package.json`, `eslint.config.js`
- Risk: Navigation, export, and score bugs ship without a failing check. A mesh rename turns the vehicle into one black material and CI stays green.
- Priority: High
- Difficulty to test: Export helpers and score math are pure and easy to extract. The canvas needs a WebGL mock or a visual regression harness; that is why it is still untested.

**Responsive and print layout:**
- What's not tested: Breakpoints at 700px and 500px, the absolute spec panel versus the in-flow explorer, and `@media print` output versus the React print-color state.
- Files: `src/components/SpecsPage.module.css`, `src/components/HeroUI.module.css`, `src/components/ReportPage.module.css`, `src/index.css`
- Risk: Mobile specs remain covered by the bottom sheet. Printed charts keep the on-screen desaturated palette.
- Priority: High
- Difficulty to test: Needs a browser or a layout test at fixed viewport widths, plus a print-media check. No such harness exists.

**3D material and camera contract:**
- What's not tested: `MATERIAL_MAP` covers every mesh name in `public/ford_ranger.glb`. Scale `0.001` and position `[0.068, -1.42, 0.446]` still plant the body on the grid. Presets in `VIEWS` look at the vehicle after that transform.
- Files: `src/components/FordRangerRaptor.jsx`, `src/components/SpecsPage.jsx`, `public/ford_ranger.glb`
- Risk: A new GLB export silently uses `DEFAULT_METAL` for unknown names. Camera presets frame empty space.
- Priority: Medium
- Difficulty to test: Mesh-name coverage can be a node test that reads the GLB JSON chunk (10 names today) and asserts each key of `MATERIAL_MAP`. Framing still needs a render.

---

*Concerns audit: 2026-09-26*
*Update as issues are fixed or new ones discovered*
