# Project Research Summary

**Project:** Ford Ranger Raptor — entrega do desafio
**Domain:** Challenge-jury sideload Android APK around an existing Vite/React/WebGL showcase (home, specs, report)
**Researched:** 2026-09-27
**Confidence:** HIGH

## Executive Summary

This is a jury handoff, not a Play product. The Ford Ranger Raptor showcase already runs in the browser as a client-only React SPA: one `useState` page (`home` | `specs` | `report`), a WebGL truck, and three CSS Modules. Experts ship that kind of app by hosting the production web build inside a system WebView. The recommended host is Capacitor 8.5.2. The React tree, the fiber canvas, and the locked SPA packages stay. Capacitor copies Vite's `dist/` into an Android project and the jury installs a debug-signed APK.

Do the web changes before the first `cap sync`. Replace the three copied fact tables with one imported `src/data/ranger.json` (numeric facts, charts derived in `ranger.js`). Apply the tokens already in `src/index.css` and fix the phone layout those tokens sit on, including the specs sheet that covers the explorer at `max-width: 700px`. Then close the offline WebGL path: a local HDRI instead of drei's `city` preset, self-hosted Inter and Bebas Neue, a capped pixel ratio, and materials that are disposed when the canvas is torn down. Only then add the Android shell (`webDir: "dist"`, no `server.url`, `assembleDebug`). The README and three stills are the last proof, taken from the build that ships.

The failures that get a delivery rejected are mechanical. Syncing before the CDN calls are gone bakes a stuck loader into the APK. Leaving `webDir` at `www`, committing live reload, or handing over an AAB produces a blank or uninstallable file. A desktop pass hides the specs overlap, the status-bar inset, and a WebGL context that dies on the second screen. Mitigate by keeping that order, testing airplane-mode cold start on a current Android 16 image or a phone, and refusing Play signing, a new design system, Expo, runtime xlsx, and a second canvas mounted at the same time.

## Key Findings

### Recommended Stack

Keep the locked SPA (React 19.2.6, Vite 8.0.12, `@react-three/fiber` 9.6.1, `@react-three/drei` 10.7.7, `three` 0.184.0, Recharts 3.8.1). Add only the wrapper, the JSON module, and the offline assets. Do not bump Vite, React, fiber, drei, or three in the same change as Capacitor: a white screen would then have two causes. Capacitor 9 is still an alpha and changes the SystemBars inset default. Full detail is in `STACK.md`.

**Core technologies:**
- `@capacitor/core`, `@capacitor/android`, `@capacitor/cli` 8.5.2: WebView host and sync — current stable line; core, CLI, and Android install together. Node `>=22.13.0` (CLI wants `>=22`, ESLint 10 tightens 22 to `^22.13.0`).
- `@capacitor/app` 8.1.1: hardware back — the SPA never pushes history, so `backButton` is the only way the APK moves report → specs → home, then exits.
- SystemBars inside `@capacitor/core` (not `@capacitor/status-bar`): edge-to-edge insets — `setBackgroundColor` does not apply on Android 16. Call `EdgeToEdge.enable(this)` from `MainActivity` before `super.onCreate` (`androidx.activity:activity` 1.11.0, already the template pin).
- Vite JSON import of `src/data/ranger.json`: the only vehicle-fact source — inlined at build time. No fetch, no schema package, no xlsx parser.
- `@fontsource/inter` 5.3.0 (weights 300–600) and `@fontsource/bebas-neue` 5.3.0 (`400.css`): offline type — same families the CSS already names. Prefer these packages over hand-written `@font-face`.
- Local `public/hdri/potsdamer_platz_1k.hdr` via `<Environment files>`: offline lighting — drop `preset="city"`. Do not pass `preset` and `files` together.
- Android Studio Otter 2025.2.1+, SDK 36, AGP 8.13.0, Gradle 8.14.3, `minSdk` 24: the 8.5.2 template — test on API 36, not the install floor. Day-to-day artifact is `./gradlew assembleDebug`, not `cap build` (CLI default is AAB).

Commit `capacitor.config.json` (`appId` `com.fiap.rangerraptor`, `webDir` `dist`, `backgroundColor` `#080a0e`, SystemBars `insetsHandling: "css"`, `style: "DARK"`, `releaseType: "APK"`). Leave `androidScheme` at `https` and Vite `base` at `/`. Do not commit `server.url` or `server.cleartext`.

### Expected Features

The audience is a challenge jury. Missing a table-stakes row is grounds to reject the delivery. Differentiators wait until the APK cold-starts with the network off. Full detail is in `FEATURES.md`.

**Must have (table stakes):**
- Debug-signed sideload APK from a fresh `dist`, config with no `server.url` — the jury installs a file; an AAB will not sideload.
- Home, specs, and report finish on a phone-width WebView, with canvas cost capped — the specs sheet already covers the explorer at `max-width: 700px`.
- Offline closure: local GLB, local HDR, self-hosted Inter and Bebas Neue — a failed HDRI is what keeps the loader up.
- One visual identity from the existing tokens on all three screens; dead header actions removed from the chrome — do not build Modelos, Configurar, Dealer, or Solicitar Proposta.
- One reconciled `ranger.json` imported by the three screens — moving the consts without picking one record leaves the disagreement in place.
- README a reviewer can execute, plus one still per screen, launcher and component names aligned to Ranger Raptor, workshop output kept out of `webDir`.

**Should have (competitive):**
- Share-sheet CSV/TXT on Android, browser blob path kept for `npm run dev` — WebView `<a download>` often does nothing; confidence is MEDIUM until a device spike.
- UTF-8 BOM and one aligned score row per competitor; print colors committed before `window.print()` — only after a file actually leaves the phone. Do not add a PDF engine.
- Hardware back that returns Relatório to the screen that opened it — v1 back can stay report → specs → home → exit; remembering the opener is the improvement.
- `backgroundColor` `#080a0e` (this is cheap and belongs in the shell config anyway) and an adaptive icon only if a 1024 px source already exists.
- One shared 3D stage for home and specs — consistency, not a new look. Do not block the APK on the extraction.
- Phone or emulator stills in the README once desktop captures are no longer the only proof.

**Defer (v2+):**
- Play Store listing, AAB, Play App Signing, privacy policy, Appflow.
- Accounts, API, analytics, push, Firebase, runtime xlsx or Google Sheet.
- New screens, a visual redesign or component library, Expo or React Native, iOS, PWA or service worker.
- Custom URL schemes, deep links, in-app updates, a PDF engine, an i18n catalog, device-farm E2E.

### Architecture Approach

The SPA stays the system of record. Capacitor is a host. The JSON is a bundled import. Colors stay in `src/index.css`, with a few hex copies in `src/theme.js` because `THREE.Color` cannot parse `var()`. No router, no store, no design-system package, no second canvas mounted at once. Full detail is in `ARCHITECTURE.md`.

**Major components:**
1. `android/` + `capacitor.config.json` — WebView process and Gradle project. React never imports from `android/`. `cap sync` copies `dist/` one way.
2. `src/App.jsx` + `src/native/androidBack.js` — page state stays `'home' | 'specs' | 'report'`. The back listener is the only React code that knows Capacitor, and it no-ops off Android. It writes `setPage`; it does not call `history.back()`.
3. `src/data/ranger.json` + `src/data/ranger.js` — JSON is the editable source; screens import only the JS module. `ranger.js` derives the Raptor comparison column and display strings so 397 / 583 are not stored twice. Camera poses stay in `SpecsPage.jsx`.
4. Screen components — `HeroUI`, `SpecsPage`, `ReportPage` read a slice and keep local UI state. Navigation stays callback props.
5. `src/index.css` tokens, shared chrome (logo and back only), `src/theme.js` — CSS Modules use `var(--*)`. SystemBars injects `--safe-area-inset-*`. `viewport-fit=cover` goes in `index.html`.
6. `README.md` + `docs/screenshots/` — documentation. Never under `public/`, or the PNGs ship inside the APK.

### Critical Pitfalls

1. **The APK is not the Vite preview** — Set `webDir` to `dist`, script `vite build` then `cap sync`, ship `assembleDebug`. No `server.url`, no `base: './'`, no AAB. `base` does not rewrite the string `useGLTF('/ford_ranger.glb')`.
2. **Desktop Chrome is online; the phone demo is not** — Point both canvases at a local HDR and self-host the fonts before the first sync. Do not enable Draco; the decoder default is `gstatic.com`. Acceptance is airplane mode from a cold start.
3. **The second screen kills the canvas** — Cap `dpr` (about `[1, 1.5]`), cut the 2048 shadow map on narrow viewports, clone the GLTF scene before writing materials, and `dispose()` on change. Keep one canvas mounted at a time. Delete `ford_ranger_split.glb` and `public/scratch` before sync. An emulator with the host GPU is a smoke test, not the sign-off.
4. **One JSON that still has three truths** — Normalize to vehicle ids and numeric metrics. Format with `pt-BR` in one place. Derive radar, bars, and CSV from that list. Keep the mock disclaimer on every screen that shows scores. Do not parse the xlsx in the WebView. Done means `src/components` has no leftover `397` or `Bi-turbo` literals.
5. **Shared colors on a desktop window, broken layout on the phone** — Fix the `700px` absolute specs panel in the same pass as the tokens. Pad with `--safe-area-inset-*` and `env()` as fallback. WebView versions before Chromium 140 misreport `env(safe-area-inset-*)`. Do not add Tailwind or a component kit. Do not call the CSS phase done on desktop screenshots.

Also strip `window.highlightMesh` before the APK, leave `hardwareAccelerated` at the platform default, and keep `density` in the manifest `configChanges` so a resize does not reload the WebView and drop the GL context.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Vehicle data contract
**Rationale:** Nothing upstream. Screen drift has to be fixed in the browser so later phases package one fact set. Mixing this edit with CSS hides which change broke a screen.
**Delivers:** `src/data/ranger.json` and `src/data/ranger.js`. Hero, specs, and report import that module only. One id-keyed numeric model (`raptor`, `hilux`, `amarok`, `s10`, `l200`). Charts, feature columns, and CSV cells are derived. Display strings are formatted in `ranger.js`. Mock disclaimer stays on every score surface. The xlsx stays an authoring archive.
**Addresses:** One reconciled JSON as the only vehicle-fact source (table stakes).
**Avoids:** Pitfall 4 (parallel arrays moved into a file that can still drift; runtime spreadsheet parse; disclaimer deleted because the JSON looks official).

### Phase 2: Runtime cleanup
**Rationale:** Changes what `vite build` will later copy. Must land before any `cap sync`, and it should not be tangled with the data schema or the token pass.
**Delivers:** `window.highlightMesh` gone. Product names aligned (launcher later, component `FordF150` renamed, export filenames). Workshop scripts stay off the runtime path. Unused binaries leave `public/` (`ford_ranger_split.glb`, scratch galleries, loose textures the renderer never samples). `npm run dev` still runs.
**Addresses:** Presentable package and source (table stakes).
**Avoids:** Shipping ~36 MB of `public/` into the APK, and a debug hook that flattens GLTF materials from any script in the WebView.

### Phase 3: Visual consistency
**Rationale:** Tokens, type, and the phone layout have to be stable before `backgroundColor`, SystemBars, and screenshots copy them. Still entirely in the browser.
**Delivers:** CSS Modules consume `var(--bg)`, `var(--accent)`, and the rest of the existing `:root` set. `@fontsource` replaces the Google Fonts `@import`. Shared logo and back chrome only, where markup is already copied. Specs at ≤700px is one scrolling column: sheet in flow, canvas at a fixed viewport height (`100dvh` on home and specs; report scrolls). Dead header links removed from the chrome, with no new routes. `src/theme.js` holds only the hex values WebGL and paint APIs cannot read from CSS. Print CSS scoped under the report page.
**Addresses:** One visual identity; phone-width layout of the three flows (table stakes). Self-hosted fonts start here so the identity is real offline.
**Avoids:** Pitfall 5 (palette-only pass that ships the covered explorer; a design-system rewrite; print rules leaking onto `html`/`body`).
**Uses:** Existing `src/index.css` tokens, `@fontsource/inter` 5.3.0, `@fontsource/bebas-neue` 5.3.0.

### Phase 4: Offline WebGL pack
**Rationale:** Immediately before the first sync. Packaging earlier freezes the CDN HDRI and Google Fonts into the native project. This phase does not wait on Gradle.
**Delivers:** `public/hdri/potsdamer_platz_1k.hdr` and `<Environment files>` on both canvases, `preset` removed. `dpr` capped, shadow map reduced or off under 700px, one shadow-casting light, `autoRotate` paused when the document is hidden. GLTF scene cloned before material writes; previous materials disposed. `Canvas` wrapped in an error boundary with a visible failure. Loader dismisses when the local GLB and HDR succeed. No Draco, no meshopt. `vite preview` with the network disabled still shows the truck.
**Addresses:** Offline closure for the three flows (table stakes). Bounded context lifetime so home → specs → home still draws.
**Avoids:** Pitfall 2 and pitfall 3. A full shared-stage extraction is not required here; do it only if the second visit is still black after dispose and the pixel budget.
**Implements:** The existing single-canvas rule (home and specs are never mounted together). Model URL stays `/ford_ranger.glb`.

### Phase 5: Sideload APK and jury README
**Rationale:** Proof phase. The data model, the tokens, and the lighting are already settled. This phase reproduces them inside a WebView and documents the file the jury installs.
**Delivers:** `capacitor.config.json` as specified in the stack. `android/` from `cap add android`, `EdgeToEdge.enable` in Java `MainActivity`, SystemBars, `viewport-fit=cover`, safe-area padding on the shell. `src/native/androidBack.js` mapping report → specs → home → exit. npm scripts: build, then sync, then `assembleDebug`. APK installs with `adb install -r`. Airplane-mode cold start on an API 36 image or a phone: three flows complete, header and spec sheet clear of the system bars, second home visit still shows the truck. README with prerequisites (Node `>=22.13.0`, Android Studio, SDK 36), install steps, and one still of each screen under `docs/screenshots/`. Spike CSV, TXT, and print once in the WebView and write down what happened.
**Addresses:** Debug-signed APK, shipped app loads bundled files, README a reviewer can execute (table stakes). `backgroundColor` `#080a0e` lands here with the config.
**Avoids:** Pitfall 1 (wrong `webDir`, live reload, AAB, relative Vite `base`). Manifest `density` left in `configChanges`. Hardware acceleration left on.
**Uses:** Capacitor 8.5.2, `@capacitor/app` 8.1.1, SystemBars, Gradle 8.14.3.
**Implements:** Capacitor host, Android back adapter, packaging flow (`vite build` → `cap sync` → APK).

### Phase ordering rationale

- Data contract and runtime cleanup change the bytes that get bundled. Visual consistency is still a browser pass, so status-bar color and screenshots are not taken of the old UI.
- The offline WebGL pack is the last web edit before `cap sync`. Resyncing a CDN build and hoping the next sync remembers the HDR is how the stuck loader survives.
- The APK phase does not invent the JSON shape, the palette, or the lighting. It proves them on a device and writes the README against the commands that actually produced the file.
- Grouping follows the architecture boundaries: data module, then tokens, then native host, then docs. WebGL budget is its own phase because it is the phone risk, not a Gradle concern.
- P2 work (share sheet, CSV BOM, back-to-opener, shared stage, adaptive icon) is a follow-on after the cold start, not a gate. Schedule it only if the export spike shows a dead control the demo script will tap.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4:** Standard drei `files` pattern. Deeper research only if someone insists on Draco or meshopt. The open question is whether this GLB plus a reduced shadow map holds a frame on the jury device. That is a runtime check, not a library search. Confidence stays MEDIUM until that run exists.
- **Phase 5:** Needs a device or API 36 emulator pass. Re-read `releaseType` (default AAB) and SystemBars `--safe-area-inset-*` if the project ever moves off Capacitor 8. Spike `window.print` and blob download on the target WebView before promising CSV or PDF in the demo script. Export behavior is MEDIUM until that spike.

Phases with standard patterns (skip research-phase):
- **Phase 1:** No library. Vite 8 already imports JSON. The spreadsheet is not a runtime integration.
- **Phase 2:** Repo hygiene. No new framework.
- **Phase 3:** CSS variables and `@fontsource` weight files. The 700px specs rule is already in the repo. Do not research a design system.
- **Phase 5 packaging steps:** Capacitor 8 workflow (build, sync, `assembleDebug`) is documented at the pinned version. The flag above is the device pass and the export spike, not how to add the Android project.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions pinned from the npm registry and the Capacitor 8.5.2 template, CLI source, and v8 docs on 2026-09-27. SPA lockfile left untouched on purpose. |
| Features | MEDIUM | Table stakes follow the brief and the current repo. Competitor set is other jury deliveries, not a market. On-device export is analogical until a WebView spike. |
| Architecture | HIGH | Boundaries match the existing SPA plus Capacitor's documented host model. Frame rate of this GLB on a phone WebView is unverified. |
| Pitfalls | HIGH | Packaging, drei CDN presets, Draco host, and Android 16 edge-to-edge are official docs. `window.print` and blob download are MEDIUM: Capacitor's Android bridge has no download hook, and device behavior was not observed. |

**Overall confidence:** HIGH

### Gaps to Address

- **WebGL budget on the jury device:** Plan the `dpr` and shadow cuts in Phase 4, then confirm home → specs → home on API 36 or a phone in Phase 5. If the second visit is still black, extract one shared stage then. Do not switch to the split GLB.
- **WebView export:** During Phase 5, tap CSV, TXT, and print once and record the result in the README. Promote the share-sheet path only if those buttons are part of the demo and do nothing. Do not add jsPDF.
- **Release signature:** Debug keystore is the default. A locally signed release APK is a fallback only if the jury rejects debug signing. Keep any keystore out of git. Do not build an AAB.
- **Which numbers win:** Phase 1 has to pick one fuel wording, one competitor set, and one score model. The sheet is an input to that decision, not a parser. If the brief does not say the figures are final, the mock line stays.
- **Icon source:** Skip `@capacitor/assets` unless a 1024 px mark already exists. The dark `backgroundColor` still ships.
- **No physical phone:** Say so. Run the emulator with network disabled. Treat host-GPU passthrough as a smoke test.

## Sources

### Primary (HIGH confidence)
- npm registry, 2026-09-27 — `@capacitor/core` 8.5.2 (9.0.0-alpha.7 not adopted), CLI engines `node >=22`, `@capacitor/android` peer `^8.5.0`, `@capacitor/app` 8.1.1, `@fontsource/inter` and `@fontsource/bebas-neue` 5.3.0
- https://capacitorjs.com/docs/config (v8) — `webDir`, `backgroundColor`, `androidScheme` default `https`, custom-scheme break after WebView 117, `releaseType` default AAB, `server.url` not for production
- https://capacitorjs.com/docs/basics/workflow and https://capacitorjs.com/docs/updating/8-0 (v8) — build, sync, run; `minSdk` 24, `targetSdk` 36, AGP 8.13.0, Gradle 8.14.3, System Bars instead of `adjustMarginsForEdgeToEdge`, `density` in `configChanges`
- https://capacitorjs.com/docs/apis/system-bars and `@capacitor/core@8.5.2` `system-bars.md` — `insetsHandling: css`, `--safe-area-inset-*`, `EdgeToEdge.enable` required in app code on Capacitor 8
- Git tag `ionic-team/capacitor` `8.5.2` `android-template/` — `MainActivity` extends `BridgeActivity`, manifest, Gradle pins, gitignore of `*.apk` and `assets/public`
- https://vite.dev/guide/features — JSON default import; `public/` copied to the dist root
- https://github.com/pmndrs/drei (Environment docs, `useEnvironment.tsx`) — `preset="city"` is a CDN HDR and not for production; `files` selects the loader by extension
- This repo — `.planning/PROJECT.md`, `.planning/codebase/`, `src/index.css`, `src/App.jsx`, `HeroUI.jsx`, `SpecsPage.jsx`, `ReportPage.jsx`, `FordRangerRaptor.jsx` (facts duplicated, Google Fonts, `preset="city"`, 700px specs panel, `window.highlightMesh`)

### Secondary (MEDIUM confidence)
- Capacitor Android `Bridge.java` (main, reviewed 2026-09-27) — no download or print hook. WebView `<a download>` and `window.print()` are unproven until a device spike.
- `.planning/codebase/CONCERNS.md` (2026-09-26) — undisposed materials, `public/` size, loader stall, report export bugs. Used as the map of current defects, not as a new measurement.
- `@capacitor/filesystem` docs — relevant only if Phase 5's export spike fails and a share sheet is promoted. The plugin does not document HTML download behavior.

### Tertiary (LOW confidence)
- None. Device frame rate and export UX are unmeasured, not sourced from a weak article. Treat them as Phase 4 and Phase 5 checks.

---
*Research completed: 2026-09-27*
*Ready for roadmap: yes*
