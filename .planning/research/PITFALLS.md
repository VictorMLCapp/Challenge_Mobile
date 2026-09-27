# Pitfalls Research

**Domain:** Sideload Capacitor APK around an existing Vite + react-three-fiber SPA, plus one JSON as the only vehicle-fact source
**Researched:** 2026-09-27
**Confidence:** HIGH for Capacitor packaging, drei CDN presets, and Android edge-to-edge (official docs). MEDIUM for WebView `window.print` / blob downloads (no download hook in Capacitor's Android `Bridge.java` on main; behavior not spelled out in the Capacitor docs reviewed).

This file is for roadmap planning. Phases below are recommended phase topics — the milestone does not have a roadmap yet. Docs were read from the Capacitor site as rendered for **v8** (version switcher also lists v9). If the project adopts v9, re-check `webDir`, `releaseType`, and System Bars before execution.

## Critical Pitfalls

### Pitfall 1: The APK the board installs is not the Vite build you just previewed

**What goes wrong:**
`vite preview` shows the Ranger. The file handed to the board is a white screen, the Vite dev server, or an Android App Bundle that a file manager will not install. Capacitor does not wrap the dev server. It copies whatever directory `webDir` names into the native project, and only after `npm run build`.

**Why it happens:**
The CLI default is `webDir: 'www'` (`cli/src/config.ts`: `conf.extConfig.webDir ?? 'www'`). This app's Vite build writes `dist` (`package.json` script `build`: `vite build`). The documented workflow is build, then `npx cap sync`, then a native compile. `server.url` is a live-reload override and the config schema says it is not for production. `npx cap build` defaults `android.buildOptions.releaseType` to **AAB**. Play Store wants an AAB. A sideload wants an APK. A debug APK (`assembleDebug` / `cap run android`) is the right artifact for a board install; a release AAB is not.

**How to avoid:**
- Set `webDir` to `dist`. Leave `server.androidScheme` at the default `https` and hostname `localhost`. Do not set `server.url` or `cleartext` in the config that gets synced into the APK.
- Script the order in `package.json`: `vite build` and then `cap sync android`. Sync after every web change that should be in the APK.
- Produce an **APK** (debug keystore is enough; Play signing is out of scope). Do not hand over an `.aab`.
- Keep Vite `base` at `'/'`. Capacitor's Android origin is `https://localhost/`, so root paths resolve. `base: './'` only rewrites HTML, CSS, and import URLs. It does **not** rewrite the string `useGLTF('/ford_ranger.glb')` in `FordRangerRaptor.jsx`. A relative base plus a custom scheme is how the bundle loads and the model 404s.

**Warning signs:**
- `capacitor.config` has no `webDir`, or `webDir` is `www`.
- `server.url` points at `http://192.168…:5173`.
- The artifact extension is `.aab`.
- `adb shell` or Chrome inspect shows `https://localhost` failing to load `/assets/*` or `/ford_ranger.glb`.
- Someone "fixed" assets with `base: './'` and did not route the GLB through `import.meta.env.BASE_URL`.

**Phase to address:**
Sideload APK. Block the phase until `dist/index.html` and `dist/ford_ranger.glb` exist and `server.url` is absent from the shipped config.

---

### Pitfall 2: Desktop Chrome is online; the phone demo is not

**What goes wrong:**
The hero loader never dismisses, the truck is flat-lit or black, and headlines fall back to a generic sans. The same build is fine on a laptop with network. drei's own docs say `Environment preset` is not for production because it loads a CDN HDRI. In this repo `preset="city"` is on both canvases (`CarViewer.jsx`, `SpecsPage.jsx`). The preset file is `potsdamer_platz_1k.hdr`, fetched from `https://raw.githack.com/pmndrs/drei-assets/…/hdri/` (`useEnvironment.tsx`, `CUBEMAP_ROOT`). `src/index.css` `@import`s Inter and Bebas Neue from `fonts.googleapis.com`. The loader in `LoaderUI.jsx` stays up until progress hits 100 and the suspense boundary clears, and `LoadingFallback` renders nothing. A failed HDRI is the existing stall, now on a device that may have no network. The milestone requires the JSON (and the demo) to work offline.

**Why it happens:**
Presets and Google Fonts look free during `npm run dev`. Packaging does not vendor them. A later "optimization" that Draco-compresses the GLB repeats the same mistake: `useGLTF` defaults the decoder to `https://www.gstatic.com/draco/versioned/decoders/1.5.5/`. The current GLB is uncompressed, so Draco is not on the path today. Adding it during the APK phase without a local decoder makes the model fail only inside the WebView when gstatic is blocked.

**How to avoid:**
- Before the first `cap sync`, point `Environment` at a file under `public/` (or a bundled URL), same call on both canvases. Self-host the two font files and drop the Google `@import`.
- Do not switch on Draco or meshopt in the packaging phase. If a later phase compresses the GLB, vendor the decoder and call `useGLTF.setDecoderPath` with a path inside the app. Never leave the gstatic default in an offline APK.
- Acceptance test is airplane mode (or an emulator with network disabled) from a cold start: loader dismisses, city lighting is present, Bebas/Inter actually load. Wi-Fi on the dev machine is not that test.

**Warning signs:**
- Built `dist/` contains the GLB and JS, and a request to `raw.githack.com` or `fonts.googleapis.com` still appears.
- `Environment preset="city"` remains in either canvas.
- A compressed GLB lands in `public/` with no local decoder path.
- The loader overlay is still the only error UI.

**Phase to address:**
Offline WebGL pack, and it must finish before Sideload APK. Syncing first bakes the CDN dependency into the native project and the next "fix" is easy to forget to re-sync.

---

### Pitfall 3: The browser is smooth and the phone canvas dies on the second screen

**What goes wrong:**
Home orbits, then Specs or the return trip is a black canvas, a stuck loader, or a few frames per second. Desktop Chrome still looks like the demo. This app mounts one of home, specs, or report (`App.jsx`), so every visit to specs creates a WebGL context and every return destroys it. `buildMaterial()` allocates materials and never `dispose()`s them. `useGLTF` caches one scene and the effect mutates it. Home and specs each ask for a 2048² shadow map, antialiasing, contact shadows, and an environment map (`CarViewer.jsx`). The `Canvas` does not set `dpr`, so a phone pixel ratio of 2.5–3 multiplies the fill rate Chrome on a desktop window never hits. There is no error boundary around `Canvas`. react-three-fiber documents that a context crash with no boundary is an uncaught failure, not a fallback.

`public/` is about 36 MB. Vite copies all of it into `dist`, and `cap sync` copies `dist` into the APK. That includes the unused 12 MB `ford_ranger_split.glb` (7,529 meshes) and the grouped GLB. Loading the split file, even by a mistaken path change while "slimming" the app, exhausts a phone GPU. The live model is the 9.2 MB `ford_ranger.glb`.

**Why it happens:**
The scene was tuned on a desktop GPU. Page switches feel cheap there. Android System WebView has a much smaller GPU budget, and throwing the context away is the demo path the board will take (home → specs → home). Emulator GPU passthrough often hides this.

**How to avoid:**
- Keep a single `Canvas` mounted for home and specs (report has no viewer). Clone the GLTF scene before writing materials, and `dispose()` the previous materials when they change. Do not mount two `FordRangerRaptor` instances.
- Cap `dpr` (for example `[1, 1.5]`), drop to one shadow-casting light, and cut the shadow map to 1024 or off on narrow viewports. Pause `autoRotate` when the document is hidden.
- Delete unused files from `public/` before the first sync: scratch captures, split GLB, loose textures the renderer never samples. Confirm the APK does not contain `ford_ranger_split.glb`.
- Wrap `Canvas` in an error boundary with a visible failure, not a permanent blur overlay.
- Prove the three flows on a physical device. An emulator with the host GPU is a smoke test, not the acceptance test. If no phone is available, say so and still run the emulator with network off and a software GPU if the image allows it.

**Warning signs:**
- `adb logcat` shows `WebGL context lost` or a Three "object already has a parent" error after one navigation.
- Frame time is fine in `vite preview` and collapses as soon as the WebView is the renderer.
- `dist/` still contains `ford_ranger_split.glb` or `public/scratch`.
- Shadow map stays `[2048, 2048]` and `dpr` is unset.

**Phase to address:**
Offline WebGL pack for the context lifetime, dispose, and pixel budget. Sideload APK only verifies on device; it should not be where the 2048 shadow map is discovered.

---

### Pitfall 4: One JSON file that still has three copies of the truth

**What goes wrong:**
`src/data/ranger.json` exists, and hero, specs, and the report still disagree. Today they already do: hero motor text is `3.0 V6 Bi-turbo` (`HeroUI.jsx`) and specs says `3.0 V6 Bi-turbo Diesel` (`SpecsPage.jsx`). The report repeats `397` / `583` / `5.4` inside `ENGINE_DATA`, `HIGHLIGHTS`, and `RADAR_DATA`, with different key casings (`raptor` vs `Raptor`). Specs component scores omit S10 and L200, which the report includes. The footer says the data is mocked. A JSON that dumps `COMPETITORS`, `RADAR_DATA`, `ENGINE_DATA`, `HIGHLIGHTS`, and `OVERALL_SCORES` side by side moves the drift into one file and keeps it.

Charts and CSV need numbers. The bar chart already plots cv, Nm, seconds, mm, and kg on one axis, and the projected score does `parseInt` on impact strings then clamps 117 to 99 and labels the clamp as `+8`. Storing display strings (`397 cv @ 3.500 rpm`, Brazilian thousands separator) in JSON makes that parsing the permanent API. Storing both the raw impacts and the badge text freezes the contradiction.

Parsing `FIAP-Ford - Data sheet_Desafio_01_v02.xlsx` inside the APK is the other failure: a spreadsheet library in the WebView, a second source of truth, and a runtime read the milestone explicitly ruled out.

**Why it happens:**
"One JSON" gets implemented as "move the consts". Each screen was authored with its own arrays. The sheet in the repo root looks like the real source, so someone wires it up at runtime to feel rigorous.

**How to avoid:**
- One normalized document, imported at build time (`import data from './ranger.json'`), not `fetch` and not an xlsx parse. Shape it as vehicles keyed by a single `id` (`raptor`, `hilux`, `amarok`, `s10`, `l200`) with numeric metrics (`powerCv`, `torqueNm`, `zeroToHundredS`, …) and a `unit` beside each metric. Hero, specs, and report read those fields. Radar rows, bar `dataKey`s, feature columns, and CSV cells are derived in code from that list.
- Format in one place with `pt-BR` (`3500` → `3.500`). Do not store a second formatted string for the same fact.
- Store upgrade impacts as numbers and compute the badge from them. Do not copy `99/100` and `+8 pts` into the file.
- Keep the mock disclaimer on every screen that shows scores, unless the brief says these figures are final. Deleting "Dados mockados" because a JSON "looks official" is a product bug. The xlsx stays an archive or a dev-only export input. It is not loaded by the app.
- Done means a search for `397`, `Bi-turbo`, and `Ranger Raptor` in `src/components` finds no numeric or spec literals, only imports from the data module.

**Warning signs:**
- The JSON has parallel arrays that mirror `RADAR_DATA` and `ENGINE_DATA` with different casings.
- Any metric value is a string that includes `cv`, `Nm`, or a comma/dot thousands separator.
- `HeroUI.jsx`, `SpecsPage.jsx`, or `ReportPage.jsx` still declare spec arrays.
- `package.json` gains an xlsx parser used from `src/`.
- The report footer disclaimer disappears while hero still states the same numbers as product facts, or only one of the three screens keeps it.

**Phase to address:**
Vehicle data contract. Do this before visual unification and before the APK, so screen drift is fixed in the browser and the native package only copies a settled `dist`.

---

### Pitfall 5: Shared colors on a desktop window, broken layout on the phone

**What goes wrong:**
Tokens match and the milestone looks done in Chrome. On the device the specs sheet covers the part list, and the hero header sits under the status bar. Unification was checked by resizing a desktop browser. Android 15 edge-to-edge (Capacitor 8 `targetSdkVersion` 36 in the upgrade guide) draws the WebView under the system bars. Capacitor 8 removed `android.adjustMarginsForEdgeToEdge` and told apps to use `env()` / the `--safe-area-inset-*` variables injected by the System Bars API. Those variables exist because `safe-area-inset-*` is wrong on Android WebView versions below 140. This app's viewport is `width=device-width, initial-scale=1.0` with no `viewport-fit=cover`, and the CSS never reads a safe-area inset.

The specs bug is already in the CSS: at `max-width: 700px`, `.specsPanel` stays `position: absolute; bottom: 0` and covers `.componentExplorer`. A token pass that does not change that rule ships the bug into the APK. Print rules in `ReportPage.module.css` target `:root`, `html`, and `body` from inside a CSS module, so they are global. Folding "all CSS" into one global sheet makes that leak the default, not an accident.

**Why it happens:**
The milestone says unify the current identity and do not redesign. The fast reading is a shared palette. The actual delivery surface is a phone WebView, where `bottom: 0` means "under the gesture bar". A new component library or Tailwind rewrite is the opposite mistake: it is a visual rewrite, which is out of scope, and it still will not inset the system bars unless someone adds the variables.

**How to avoid:**
- Extract colors, type, and the `700px` / `500px` breakpoints that already exist into one token file used by the three modules. Do not add a design system.
- Fix the specs small-screen overlap as part of unification: one scrolling column, spec sheet in flow, canvas at a fixed viewport height. Then add padding from `--safe-area-inset-top/bottom` with `env(safe-area-inset-*)` as the fallback, matching the System Bars docs. Set `viewport-fit=cover`.
- Scope print CSS under a report page class. Do not retune `Environment`, materials, or camera presets in the CSS phase.
- Self-hosted fonts are part of this phase as well as the offline pack. A token named `--font-display: 'Bebas Neue'` is not unified when the phone never downloads the family.
- Verify at a phone width inside the WebView after insets exist, not only with Chrome device mode.

**Warning signs:**
- A new UI framework appears in `package.json` for a "consistency" pass.
- `700px` is still copied in each module, and `.specsPanel` is still absolute.
- No rule mentions `safe-area` or `--safe-area-inset`.
- Desktop screenshots are the only evidence attached to the phase.

**Phase to address:**
Visual consistency (no redesign) for tokens, the 700px specs overlap, and font files. Sideload APK re-checks the same screens under real system bars. Do not call the CSS phase done on desktop screenshots alone.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `cap sync` a debug APK and skip a release keystore | Board can install today | Cannot upload to Play; fine for this milestone | Acceptable. Play signing is out of scope. Do not spend the phase on a release keystore. |
| Leave `server.url` in config "so we can live-reload on the phone" | Fast iteration | The APK the board copies loads your laptop or a blank WebView | Never in the artifact you hand over. Use `cap run --live-reload` locally, then remove `url` and rebuild before sync. |
| Dump existing consts into `ranger.json` without a schema | Diff looks like a move | Hero/specs/report keep drifting; charts parse strings | Never. Normalize to ids and numbers in the data phase. |
| Parse the xlsx in the WebView | Sheet in the repo feels authoritative | Heavy lib, offline fragility, two sources | Never at runtime. Dev-only export script is optional; the checked-in JSON is what the app loads. |
| `base: './'` copied from an Ionic starter | Relative URLs "usually" work | GLB string stays absolute; custom schemes 404 it | Never here. Keep `base: '/'` and `androidScheme: 'https'`. |
| Draco-compress the 9.2 MB GLB while packaging | Smaller download | Decoder fetched from gstatic; model never loads offline | Only in a later phase that vendors the decoder and retests the phone. |
| Cap `dpr` and shadows only inside the APK branch | Desktop demo stays pretty | Phone jank, context loss; easy to forget on the next sync | Do it in the WebGL pack so `vite preview` and the APK match. |
| One global CSS file that replaces the modules | "Single source" for the look | Print rules and `overflow` on `html/body` hit every screen; high chance of a visual rewrite | Never as a rewrite. Shared tokens, modules stay. |
| Ship all of `public/` | No time to see what is referenced | ~27 MB of unused binaries in the APK; split GLB is a GPU trap if referenced | Never. Trim before first sync. |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Capacitor `webDir` | Leave the default `www` while Vite emits `dist` | `webDir: 'dist'`. Build, then `npx cap sync android`. |
| `server.url` | Leave the LAN dev URL in the config that ships | Live reload only on the dev machine. Shipped config has no `url` and no `cleartext`. |
| `cap build` / Gradle | Default `releaseType` is `AAB` | Sideload artifact is an APK. Debug signing is enough for the board. |
| Android System Bars | Assume `bottom: 0` is the bottom of the glass | Pad with `--safe-area-inset-*` (WebView &lt; 140 lies about `env(safe-area-inset-*)`). |
| drei `Environment preset="city"` | Treat the preset as an asset you already have | Official docs: presets are CDN HDRIs and are not for production. Use `files` with a local HDR. |
| `useGLTF` Draco default | Compress the GLB and assume the decoder is bundled | Default decoder host is `www.gstatic.com`. Set `useGLTF.setDecoderPath` to a local path or do not compress. |
| Google Fonts `@import` | Unify typography by naming the families | Self-host Inter and Bebas Neue. The APK must not request `fonts.googleapis.com`. |
| `window.print` and `<a download>` blob URLs | Assume Chrome's PDF dialog and file download exist in the WebView | Capacitor's Android `Bridge.java` (main, reviewed 2026-09-27) sets no download listener. Verify CSV/TXT/PDF on device in the APK phase. If `print` is a no-op, do not block the demo on it; write the file via the Filesystem/Share plugins or document that export is browser-only. Fix the existing print race (`setState` then immediate `print`) only where print actually works. |
| Spreadsheet in the repo root | Import it at runtime so the JSON "cannot drift" | Runtime stays JSON. The sheet is not a packaged dependency. |

## Performance Traps

The scale that matters is one mid-range phone GPU and a cold start, not concurrent users. This app has no server.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Uncapped `devicePixelRatio` plus 2048² shadows, contact shadows, and `autoRotate` | Smooth in desktop Chrome, hot phone, single-digit FPS, then context loss | `dpr={[1, 1.5]}`, one shadow light, 1024 or off under 700px, pause rotate when hidden | First minute on a physical phone. A desktop window will not show it. |
| New WebGL context on every home ↔ specs transition, materials never disposed, GLTF cache mutated | Black canvas on the second visit; memory climbs in `adb shell dumpsys meminfo` | One mounted canvas; clone scene; `dispose()` materials | Second navigation on Android. Desktop often survives the leak. |
| Full `public/` copied into the APK | Long install, 30 MB+ of assets the viewer never fetches | Ship `ford_ranger.glb` (or the one replacement) and fonts/HDRI only | Every install. Catastrophic only if something loads the 7,529-mesh split GLB. |
| Remote HDRI on the critical path | Loader stuck at the blur overlay | Local HDR before sync | Any offline or filtered network, including the board's phone. |
| Eager import of specs and report (Recharts + a second scene graph) | Home download includes charts | Acceptable for a sideload demo. Lazy-load only if the APK JS parse is visibly slow on device. Do not block packaging on a bundle-splitting project. | Noticeable on low-end WebViews if the JS parse delays the first frame. Measure before splitting. |

## Security Mistakes

This app has no accounts, no API keys, and no server. The risks that matter are what the sideload WebView will load and what debug hooks ship inside it.

| Mistake | Risk | Prevention |
|---------|------|------------|
| `server.url` and `cleartext: true` left in the shipped config | The board's phone loads an HTTP origin you do not control, or nothing. Schema text: cleartext is not for production. Android blocks cleartext from API 28 unless this flag is on. | Shipped config has neither field. |
| `window.highlightMesh` still assigned in `FordRangerRaptor.jsx` | Any script in the WebView flattens the shared GLTF materials with no restore. Remote debugging makes that trivial. | Remove the hook in runtime cleanup, before the APK phase. Do not attach helpers to `window` under `src/`. |
| `webContentsDebuggingEnabled: true` in the build you hand over | Anyone can attach a debugger to the WebView | Leave it off in the artifact. Debug via `cap run` locally. |
| CDN HDRI, Google Fonts, or a gstatic Draco decoder | The demo depends on third parties. A blocked response is a stuck UI, not a secret leak. There is no CSP today. | Vendor those bytes. A CSP is optional and easy to get wrong (`blob:`, `wasm-unsafe-eval` if a decoder appears). Do not add a strict CSP in the same change as the first APK. |
| Mock scores next to a Ford copyright line, disclaimer only on the report | The board reads hero numbers as official and the report as a demo, or the reverse after the JSON move | Same disclaimer on every screen that shows scores. The JSON phase does not delete it. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Loader waits on a CDN HDRI and has no error, timeout, or "already cached" state | The board sees a blur and cannot tap Specs or the report. Returning home flashes the loader again because `mounted` starts at the loading state. | Local HDRI. Dismiss the overlay when the GLB is cached. Show a retry if the load fails. One canvas so the return trip does not replay the intro. |
| Specs sheet pinned to `bottom: 0` under the navigation bar | The part list is covered on the device the APK is for. Desktop widths hide this. | In-flow sheet at ≤700px, plus safe-area padding. |
| PDF / CSV / TXT assumed to behave like Chrome | The board taps PDF and nothing happens, or a blob URL never becomes a file. CSV is already five broken score rows and has no UTF-8 BOM. | Device-check the three export buttons in the APK phase. Keep TXT as the readable fallback. Do not invent a new export product; fix the no-op if the demo script includes it. |
| Orbit on a page that also scrolls | Vertical drags move the WebView instead of the truck, or the opposite, on the specs column layout. | One gesture owner per region: canvas handles rotate, the sheet scrolls. Confirm with a finger, not a mouse. |
| Dead hero links ("Modelos", "Configurar", "Dealer", "Solicitar Proposta") | Already `href="#"` or no `onClick`, and hidden at narrow widths. "Fixing" them with new routes is a new product. | Leave them. The demo path is Specs and Relatório. |

## "Looks Done But Isn't" Checklist

- [ ] **APK identity:** The file is an `.apk`, installs with unknown sources, and opens `https://localhost` with no `server.url`. Verify by installing on a device that is not on the dev machine's Wi-Fi.
- [ ] **Offline hero:** Airplane mode, force-stop, cold start. Loader clears, HDRI is local, fonts are local, GLB is `dist/ford_ranger.glb`.
- [ ] **Three flows:** Home orbit, specs camera and tabs, report charts, then back. The second home visit still shows the truck (no black canvas, no stuck blur).
- [ ] **webDir contents:** `dist/` has no `ford_ranger_split.glb`, no `public/scratch`, no unused texture dump. The APK size is in the same range as the live GLB plus JS, not ~36 MB of `public/`.
- [ ] **Single data source:** Components do not literal-define power, torque, or rival rows. Radar, bars, and CSV use the same ids. Disclaimer still visible where scores show. Fuel wording matches on hero and specs.
- [ ] **Phone layout:** Specs at a real phone width and under system bars: explorer visible, sheet not covering it, header not under the status bar.
- [ ] **Exports:** CSV, TXT, and PDF tried once in the WebView. Document the result. A green `vite preview` export does not count.
- [ ] **Debug leftovers:** No `window.highlightMesh`. Workshop scripts are not required to launch the app. README states build, sync, and which APK to install.
- [ ] **Config drift:** `androidScheme` is still `https`. Manifest `configChanges` still includes `density` (current Capacitor Android template has it; the v8 upgrade notes say omitting it reloads the WebView on resize and drops the page, including the GL context).

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| White screen because `webDir` or `server.url` is wrong | LOW | Point `webDir` at `dist`, remove `server.url`, `npm run build`, `npx cap sync android`, reinstall the APK. No scene rewrite. |
| Stuck loader / flat lighting offline | LOW | Add a local HDR and local fonts, rebuild, sync, reinstall. Same for a Draco decoder if a compressed GLB already shipped. |
| Black canvas after navigation | MEDIUM | Keep one canvas, clone the scene, dispose materials, lower `dpr` and shadows. Re-test on the phone. Do not "fix" it by loading `ford_ranger_split.glb`. |
| Handed the board an AAB | LOW | Rebuild with the APK output (`assembleDebug` or `androidreleasetype APK`) and send that file. |
| JSON copied the parallel arrays and screens still disagree | MEDIUM | Replace the file with one id-keyed numeric model and derive charts. Search components for leftover literals. |
| CSS tokens landed but the phone layout is covered by the sheet or the system bars | MEDIUM | Fix the 700px absolute panel and add safe-area padding. Do not start a visual rewrite. |
| PDF/CSV silent in the WebView | LOW to MEDIUM | If the demo can live on TXT, document it. If the board must export, write the blob through Filesystem and share it. Browser `print` timing fixes do not help a WebView that never opens a print dialog. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Parallel consts moved into a JSON that can still drift; xlsx parsed at runtime; disclaimer dropped | Vehicle data contract | Hero, specs, and report render the same power, torque, fuel, and rival set from one import. A search of `src/components` finds no second copy. Charts read numbers. Mock line still shown on score screens. |
| `window.highlightMesh`, workshop scripts on the import path, scratch files about to be copied into `dist` | Runtime cleanup (before any `cap sync`) | Production bundle assigns nothing on `window`. `dist/` after build has the live GLB only, plus the local HDR and fonts. App still runs with `npm run dev`. |
| Token pass that ignores the 700px specs overlap, leaks print CSS, or replaces the UI kit | Visual consistency, no redesign | Same colors and type on three screens. Specs usable at 700px and 390px in the browser. No new UI framework. Print selectors do not target bare `html`/`body`. |
| CDN HDRI, Google Fonts, uncapped DPR, 2048 shadows, context churn, Draco-from-gstatic | Offline WebGL pack | Network panel offline: no githack, googleapis, or gstatic. One canvas survives home → specs → home. `dpr` capped. Phone-class frame rate checked later on device; desktop preview must still show the truck with local lighting. |
| Wrong `webDir`, `server.url` shipped, AAB instead of APK, `base: './'` vs absolute GLB, edge-to-edge, export no-ops, emulator-only sign-off | Sideload APK | Install the APK on a device in airplane mode. Three flows complete. System bars do not cover header or spec sheet. Artifact is an APK. README matches the commands that produced it. |
| Manifest `density` flag removed; hardware acceleration turned off to "stop flicker" | Sideload APK | `configChanges` includes `density`. `hardwareAccelerated` is not `false` (platform default is on; WebGL needs it). Rotating the phone does not reload the WebView into a white screen. |

**Order:** data contract and runtime cleanup first (they change what gets bundled). Visual consistency next, still in the browser. Offline WebGL pack immediately before the first sync, so the native project never contains the CDN build. Sideload APK last, and it is a proof phase, not the place that invents the data model or the lighting.

**Research flags for later phases:**
- Sideload APK: needs a device pass. Confirm on that Capacitor major (`v8` reviewed here; re-read if `v9`) that `releaseType` still defaults to AAB and that System Bars still inject `--safe-area-inset-*`.
- Offline WebGL pack: standard drei `files` pattern. Deeper research only if someone insists on Draco or meshopt.
- Exports inside the WebView: spike `window.print` and blob download on the target WebView before promising PDF/CSV in the demo script. Confidence is MEDIUM until that spike.
- Vehicle data contract: no library research. The spreadsheet is not a runtime integration.

## Sources

- Capacitor workflow (build, then `npx cap sync`, then native compile), docs v8, fetched 2026-09-27: https://capacitorjs.com/docs/basics/workflow
- Capacitor config schema: `webDir`, `server.url` ("not intended for use in production"), `server.androidScheme` default `https` and the Chrome 117 custom-scheme path warning, `cleartext` not for production, `android.buildOptions.releaseType` default `AAB`, `minWebViewVersion`: https://capacitorjs.com/docs/config
- CLI default `webDir ?? 'www'` in `@capacitor/cli` `cli/src/config.ts` on main, fetched 2026-09-27: https://github.com/ionic-team/capacitor
- Live reload (`server.url`, `cleartext: true`) is a dev setup: https://capacitorjs.com/docs/guides/live-reload
- Updating to Capacitor 8: `minSdkVersion` 24, `targetSdkVersion` 36, `adjustMarginsForEdgeToEdge` removed in favor of System Bars and CSS insets, `density` in `configChanges` so the WebView does not reload on resize: https://capacitorjs.com/docs/updating/8-0
- System Bars plugin: `--safe-area-inset-*` fallback because Android WebView &lt; 140 misreports `env(safe-area-inset-*)`; `insetsHandling` default `css`: https://capacitorjs.com/docs/apis/system-bars
- Current Android template manifest includes `density` in `configChanges` and does not disable hardware acceleration: `android-template/app/src/main/AndroidManifest.xml` on main
- Vite public base path: `base: './'` rewrites generated URLs, not hand-written string concatenations; dynamic paths must use `import.meta.env.BASE_URL`: https://vite.dev/guide/build.html
- drei Environment: preset is not for production and loads HDRI Haven files from a CDN; `city` → `potsdamer_platz_1k.hdr`: https://github.com/pmndrs/drei/blob/master/docs/staging/environment.mdx and `src/core/useEnvironment.tsx` (`CUBEMAP_ROOT` on `raw.githack.com`)
- drei `useGLTF` Draco default `https://www.gstatic.com/draco/versioned/decoders/1.5.5/`: `src/core/Gltf.tsx` and https://github.com/pmndrs/drei/blob/master/docs/loaders/gltf-use-gltf.mdx
- react-three-fiber Canvas: error boundary for WebGL context crashes; `dpr` / `frameloop` performance notes: https://github.com/pmndrs/react-three-fiber/blob/master/docs/API/canvas.mdx and `docs/advanced/scaling-performance.mdx`
- This repo, not rediscovered: `.planning/codebase/CONCERNS.md` (2026-09-26) for mesh ids, undisposed materials, duplicated scene, remote HDRI and fonts, `public/` size, loader stall, specs absolute panel, report export bugs, `window.highlightMesh`
- MEDIUM: blob download and `window.print` in Android WebView. Capacitor `Bridge.java` on main contained no download or print hook when searched on 2026-09-27. Treat device behavior as unproven until the APK phase spikes it.

---
*Pitfalls research for: Capacitor sideload of a Vite/WebGL showcase and a single vehicle JSON*
*Researched: 2026-09-27*
