# Architecture Research

**Domain:** Capacitor Android shell, one bundled JSON data module, and shared visual tokens on an existing client-only React SPA
**Researched:** 2026-09-27
**Confidence:** HIGH

The SPA stays the system of record. Capacitor is a host that loads the Vite production build. The JSON module is a bundled import, not a fetch. Visual consistency stays in the CSS variables that already live in `src/index.css`, plus the few hex values WebGL cannot read from CSS. No router, no store, no design-system package, no second canvas.

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  Android host (outside the React tree)                           │
│  android/  ·  capacitor.config.json  ·  SystemBars               │
│  WebView origin: https://localhost  (default scheme + hostname)  │
├──────────────────────────────────────────────────────────────────┤
│  Vite production build  (webDir: "dist")                         │
│  index.html + hashed JS/CSS  ·  public files copied to dist root │
│  bundled ranger.json inside the JS chunk  ·  /ford_ranger.glb    │
├──────────────────────────────────────────────────────────────────┤
│  Page shell  src/App.jsx                                         │
│  useState page: 'home' | 'specs' | 'report'                      │
│  hardware back listener writes the same setPage                  │
├──────────────┬───────────────────────┬───────────────────────────┤
│ HeroUI       │ SpecsPage             │ ReportPage                │
│ + LoaderUI   │ own <Canvas>          │ no canvas                 │
│ + CarViewer  │ CameraController      │ Recharts + Blob export    │
├──────────────┴───────────────────────┴───────────────────────────┤
│  src/data/ranger.json  ← imported by all three screens           │
│  src/index.css tokens  ← CSS Modules; theme.js only for lights   │
│  FordRangerRaptor.jsx  ← useGLTF('/ford_ranger.glb')             │
└──────────────────────────────────────────────────────────────────┘
         ▲ screenshots and README sit beside this, not inside it
         docs/screenshots/*.png   README.md
```

What does not move:

- `src/main.jsx` still mounts `<App />` in `StrictMode`.
- `src/App.jsx` still mounts exactly one of home, specs, or report. Home and specs keep separate canvases; they are never mounted together.
- `src/components/FordRangerRaptor.jsx` stays the only model component. Scene rig duplication (lights, grid, contact shadows) is an existing issue and is not part of this milestone’s shell.
- Navigation callbacks stay props (`onHome`, `onBack`, `onViewSpecs`, `onViewReport`). Screens still do not import `App`.

### Component Responsibilities

| Component | Responsibility | Typical implementation |
|-----------|----------------|------------------------|
| `android/` | WebView process, Gradle project, APK. Does not import React. | `npx cap add android`, then `cap sync` copies `dist/` into the native project |
| `capacitor.config.json` | Points the CLI at the Vite output and sets the WebView backdrop to the same dark background as the page | `webDir: "dist"`, `backgroundColor` equal to `--bg`. No `server.url` in the committed file |
| Vite build | Bundles the SPA and copies `public/` to the root of `dist/` | Existing `vite build`. Default `base` stays `/` |
| Page shell | Chooses the mounted screen and owns the Android back mapping | Existing `useState` in `src/App.jsx`, plus one listener |
| Android back adapter | Translates the hardware button into `setPage`. Exits only from home | `@capacitor/app` `backButton` listener, Android only |
| `src/data/ranger.json` | Single source for vehicle facts, spec tables, explorer copy, and comparison tables | Static JSON imported by Vite. Not fetched |
| `src/data/ranger.js` | The module screens import. Re-exports the JSON and derives the Raptor column of comparison rows from `vehicle` so 397 / 583 are not stored twice | Tiny JS next to the JSON. Not a store |
| Screen components | Layout, local UI state, charts, export | `HeroUI.jsx`, `SpecsPage.jsx`, `ReportPage.jsx`. They read a slice of the data module |
| Camera bookmarks | Specs-only poses (`VIEWS`, `NAV_CATEGORIES`) | Stay in `SpecsPage.jsx`. They are scene coordinates, not vehicle facts |
| CSS tokens | Colors, type, safe-area padding for DOM | `:root` in `src/index.css`. CSS Modules use `var(--*)` |
| `src/theme.js` | The same accent (and competitor series colors) as JS strings for Three.js lights and any paint API that cannot parse `var()` | A handful of constants. Comment points at `src/index.css` |
| Shared chrome | Logo button and back control that are already copied across screens | One or two components in `src/components/`, styled with the existing tokens. Not a component library |
| Model loader | GLB fetch, scale, materials | Unchanged `useGLTF('/ford_ranger.glb')` and `useGLTF.preload` |
| README + screenshots | How to run, how to build the APK, and a static picture of the three screens | `README.md` and `docs/screenshots/`. Not imported by `src/` and not placed in `public/` |

## Recommended Project Structure

```
Challenge_Mobile/
├── android/                    # Capacitor host. Source, not a Vite output
├── capacitor.config.json       # webDir, appId, backgroundColor, SystemBars
├── docs/screenshots/           # home.png, specs.png, report.png for the README
├── public/ford_ranger.glb      # stays here. Copied to dist root, then into the APK
├── src/
│   ├── data/
│   │   ├── ranger.json         # facts and comparison tables
│   │   └── ranger.js           # import surface for the three screens
│   ├── native/
│   │   └── androidBack.js      # back-button listener; no-op off Android
│   ├── components/             # existing screens, model, canvases, CSS Modules
│   │   └── AppChrome.jsx       # only if the copied header/back markup is extracted
│   ├── theme.js                # hex mirror for WebGL / chart paints
│   ├── index.css               # tokens, self-hosted fonts, safe-area
│   ├── App.jsx                 # page state + back adapter
│   └── App.css                 # viewport frame
└── README.md
```

### Structure Rationale

- **`android/` and `capacitor.config.json`:** Native host lives beside the SPA, not under `src/`. React never imports from `android/`. Gradle build folders (`android/app/build`, `.gradle`) are outputs; the project directory itself is how the APK is reproduced.
- **`src/data/`:** First non-component folder under `src/`. Matches the existing rule that a value used by more than one screen leaves the screen file. JSON is the editable source; `ranger.js` is the import the screens use so reshaping stays out of JSX.
- **`src/native/`:** The only React-side code that knows Capacitor. Screens stay unaware of the WebView. Browser `npm run dev` does not need a device.
- **`src/theme.js` next to `src/index.css`:** Two files because CSS variables and `THREE.Color` do not share a parser. This is a mirror of a few colors, not a token pipeline.
- **`docs/screenshots/`:** Demo images are documentation. `public/` would copy them into `dist/` and into the APK.
- **Camera tables stay in `SpecsPage.jsx`:** Only `CameraController` reads `pos` and `target`. Those tuples assume the ground plane at `y = -1.42`. Putting them in `ranger.json` would make the vehicle file depend on the scene.

## Architectural Patterns

### Pattern 1: Capacitor hosts the existing build

**What:** The Android app is a WebView pointed at the files Vite already emits. `webDir` is `dist`. `npx cap sync` copies that directory and updates native dependencies. The React tree does not gain a native renderer.

**When to use:** This milestone. The 3D viewer is WebGL in the browser and stays there.

**Trade-offs:** One web codebase and a real APK. The cost is WebView chrome (status bar, back button, safe area, viewport) and a second build step after `vite build`. There is no live binding from Gradle back into React components.

**Example:**

```json
{
  "appId": "com.fiap.rangerraptor",
  "appName": "Ford Ranger Raptor",
  "webDir": "dist",
  "backgroundColor": "#080a0e",
  "plugins": {
    "SystemBars": {
      "insetsHandling": "css",
      "style": "DARK"
    }
  }
}
```

`appId` only has to be unique for sideload. `backgroundColor` is the WebView backdrop (Capacitor config, since 1.1.0) and must match `--bg` so the first frame is not white. Do not commit `server.url`; that key is for a dev machine live-reload session.

Leave Vite `base` at its default `/`. Capacitor’s default Android origin is `https://localhost` (`server.androidScheme` default `https`, `server.hostname` default `localhost`). Root-absolute URLs resolve. A relative `base: './'` is for hosts that are not served at `/`. It does not rewrite the string `'/ford_ranger.glb'` inside `useGLTF`, so changing `base` does not fix the model path and is not required here.

The GLB stays in `public/`. Vite copies `public/` to the root of `dist` unchanged. `useGLTF('/ford_ranger.glb')` requests `https://localhost/ford_ranger.glb`, which is that copied file. Do not switch the model to a hashed `src/` import unless the `useGLTF` argument is the imported URL.

Official constraint: on Android WebView 117+, a custom scheme other than `http` or `https` cannot change the URL path and breaks asset resolution. Keep the default `https` scheme.

### Pattern 2: One bundled JSON module, three readers

**What:** Vehicle facts move out of `HeroUI.jsx`, `SpecsPage.jsx`, and `ReportPage.jsx` into `src/data/ranger.json`. Vite 8 imports JSON as a module (`import json from './ranger.json'`), including named root fields. The object is in the JS bundle. Nothing fetches it at runtime, so the APK does not need a network for the numbers.

**When to use:** Any fact that is shown on a screen today as a module-level constant: hero teaser rows, `SPECS_DATA`, `COMPONENTS`, and the report catalogs (`COMPETITORS`, radar, engine, scores, feature matrix, grades, upgrades, highlights).

**Trade-offs:** The bundle grows by the size of the catalogs (small next to the GLB). Screens re-render from a static import, so there is no loading state and no error state for data. The file can still duplicate a number internally if chart rows copy `vehicle.powerCv`. The JS wrapper exists to stop that.

**Shape:**

- `vehicle` — canonical Raptor facts (power, torque, engine name, and the formatted strings the hero and spec list show).
- `specs.sections` — today’s `SPECS_DATA`.
- `specs.components` — today’s explorer records. `viewId` may point at a camera id that still lives in `SpecsPage`.
- `report` — competitors **without** hex colors, plus radar, feature matrix, grades, upgrades, highlights. Engine rows for other trucks live here. The Raptor cells are filled from `vehicle` inside `ranger.js`.

Screens import `src/data/ranger.js` only. Hero reads the teaser list. Specs reads sections and components. Report reads the comparison slice. Local UI state (open tab, selected component, export flag, camera id) stays in the screen.

Competitor colors are not data. The JSON stores ids (`raptor`, `hilux`, `amarok`, `s10`, `l200`). The screen maps an id to a token.

### Pattern 3: Tokens in CSS, a stub mirror for WebGL

**What:** `src/index.css` remains the color and type source. CSS Modules replace hardcoded `#f54b2e` and `#080a0e` with `var(--accent)` and `var(--bg)`. Repeated header and back markup becomes one component that uses those variables. No Tailwind, no CSS-in-JS, no component library.

**When to use:** Every DOM color that is already the accent or the page background. Recharts SVG attributes can take `var(--accent)` as a string in Chromium. Three.js `color` props cannot: `THREE.Color` does not parse `var()`. Those call sites (`pointLight` in `CarViewer.jsx` and the specs canvas) import `src/theme.js`.

**Trade-offs:** Two representations of the accent exist on purpose. The CSS file wins for UI. `theme.js` is allowed to drift if nobody updates it; the prevention is keeping it to the colors WebGL actually uses and not growing a theme object. Extracting a full button/card kit would invent a design system the milestone forbids. Extract only the chrome that is already copied (logo button, back button).

**Fonts:** `src/index.css` currently loads Inter and Bebas Neue with a Google Fonts `@import`. That request fails when the WebView is offline, and the visual identity falls back to a generic sans. The token layer vendors the font files (for example under `src/assets/fonts/`) and declares `@font-face`. The APK then carries the type the three screens already use.

**Safe area:** Capacitor 8’s SystemBars API (bundled in `@capacitor/core` since 8.0.0) injects `--safe-area-inset-*` when `insetsHandling` is `css` (the default). Apply them on the shell, with `env()` as the second fallback:

```css
html {
  padding-top: var(--safe-area-inset-top, env(safe-area-inset-top, 0px));
  padding-bottom: var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px));
  padding-left: var(--safe-area-inset-left, env(safe-area-inset-left, 0px));
  padding-right: var(--safe-area-inset-right, env(safe-area-inset-right, 0px));
}
```

`SystemBarsStyle.Dark` means light icons on a dark background. That is the style for `#080a0e`. `setBackgroundColor` and `overlaysWebView` belong to the legacy Status Bar plugin and do not work for Android 16 edge-to-edge. Do not plan the status bar color on that plugin. The page background and `backgroundColor` in the Capacitor config paint the inset.

**Viewport:** `index.html` needs `viewport-fit=cover` so those insets are real. The existing `@media (max-width: 700px)` rule in `src/index.css` and `src/App.css` sets `height: auto` on the shell. A phone WebView is under 700px, so the APK hits that rule. Home’s canvas is `position: absolute; inset: 0` inside `.app`. An auto-height containing block does not give that canvas a resolved height. Home and specs need a definite viewport (`100dvh`, overflow hidden). Report is the screen that scrolls. That split belongs on the page shell, not in a new layout framework.

### Pattern 4: Hardware back writes the page state that already exists

**What:** This SPA does not push browser history. `canGoBack` on the Capacitor back event is the WebView history flag, and it stays false after the single initial load. Listening for `backButton` also disables the default handler, so the app must move pages itself or call `App.exitApp()`.

**When to use:** The Android shell. Register the listener once from `src/App.jsx`, because that is the only place that owns `page`.

**Trade-offs:** The back stack is the same three strings as the on-screen buttons: report goes to specs (`onBack` already does this), specs goes to home, home exits. Specs local state is still destroyed when the page unmounts. That matches the current shell. Do not add React Router so the WebView history matches the screens.

**Example:**

```javascript
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

export function listenAndroidBack(getPage, setPage) {
  if (Capacitor.getPlatform() !== 'android') return () => {}
  const handle = CapApp.addListener('backButton', () => {
    const page = getPage()
    if (page === 'report') setPage('specs')
    else if (page === 'specs') setPage('home')
    else CapApp.exitApp()
  })
  return () => { handle.then((h) => h.remove()) }
}
```

`href="#"` links in the hero nav are not this stack. They must not become the thing the hardware button walks.

## Data Flow

### Request flow

There is no request for product data. The only network-shaped load is the GLB, and it is a same-origin file URL inside the WebView.

```
Jury installs APK
    ↓
WebView loads https://localhost/index.html  (files copied from dist/)
    ↓
src/main.jsx mounts App
    ↓
┌─ page === 'home' ─────────────────────────────────────────────┐
│  HeroUI reads ranger.vehicle                                  │
│  CarViewer → FordRangerRaptor → GET /ford_ranger.glb          │
│  LoaderUI watches drei useProgress                            │
└───────────────────────────────────────────────────────────────┘
    ↓ setPage('specs' | 'report')   or hardware back
┌─ specs ──────────────────────┐  ┌─ report ────────────────────┐
│  second Canvas, same GLB URL │  │  charts read ranger.report  │
│  camera id stays local state │  │  CSV/TXT Blob, or print()   │
└──────────────────────────────┘  └─────────────────────────────┘
```

Packaging flow, separate from a tap:

```
ranger.json + screens + public/ford_ranger.glb
    ↓  vite build
dist/index.html + dist/assets/* + dist/ford_ranger.glb
    ↓  npx cap sync android
android WebView asset directory
    ↓  Gradle assemble
APK
```

### State management

```
ranger.json  →  ranger.js  →  screen render (read-only)
page useState in App.jsx  ←  button callbacks and Android back listener
screen useState  →  tabs, camera id, export flag (dies on unmount)
drei GLTF cache  →  both canvases, keyed by '/ford_ranger.glb'
```

No context and no store. The JSON module is evaluated once. Switching pages does not reload it. Refresh in the browser still returns to `'home'` because `page` is not in the URL. The APK behaves the same way on a cold start.

### Key data flows

1. **Facts:** `ranger.json` → `ranger.js` → `HeroUI`, `SpecsPage`, `ReportPage`. Direction is one way. Screens do not write back.
2. **Navigation:** UI buttons and the Android back listener → `setPage` in `App.jsx` → one screen mounts, the others unmount. The listener does not call `history.back()`.
3. **Model:** `public/ford_ranger.glb` → Vite `dist/` → Capacitor copy → `useGLTF('/ford_ranger.glb')`. The JSON does not reference the GLB. Mesh names stay in `MATERIAL_MAP`.
4. **Color:** `src/index.css` variables → CSS Modules and shared chrome. The same hex is copied into `capacitor.config.json` `backgroundColor` and into `src/theme.js` for lights. SystemBars only sets icon style (`DARK`), not the fill.
5. **Demo:** After the three screens render from the JSON with the shared tokens, capture PNGs into `docs/screenshots/`. The README links them. The running app never loads those PNGs.

## Suggested build order

Dependencies, not risk order. The WebGL-in-WebView check does not need the JSON, but the shell’s backdrop color and the screenshots do need the token pass, and the APK the README describes should already contain the JSON. Verify the GLB inside the shell phase; a WebView failure does not force a change to the data shape.

```
1. ranger.json + ranger.js
        │  screens drop in-file catalogs
        ▼
2. CSS tokens, self-hosted fonts, shared chrome, theme.js
        │  --bg / --accent are stable
        ▼
3. Capacitor shell
        │  webDir dist, GLB URL unchanged, back listener,
        │  SystemBars, viewport / safe-area in App.css
        ▼
4. README + docs/screenshots
```

| Step | Produces | Depends on | Do not start before this because |
|------|----------|------------|-----------------------------------|
| 1. Data module | `src/data/ranger.json`, `src/data/ranger.js`, three screens reading it | Existing screen constants | Nothing upstream. Doing tokens in the same edit mixes a data move with a CSS move in the same files |
| 2. Tokens and shared chrome | `var(--*)` in CSS Modules, `@font-face`, optional `AppChrome`, `src/theme.js` | Step 1, so screen files are no longer full of catalogs | Status bar style and `backgroundColor` copy these values. Screenshots should show the unified UI |
| 3. Capacitor shell | `capacitor.config.json`, `android/`, `src/native/androidBack.js`, viewport rules, npm script that runs `vite build` then `cap sync` | Step 2 for colors. Existing `page` state for the back button. Step 1 so the synced `dist/` contains the JSON | Packaging earlier ships the duplicated constants and the Google Fonts import. Resync after step 1 is wasted motion |
| 4. README and static demo | Root `README.md`, three PNGs under `docs/screenshots/` | Steps 1–3 | The doc has to name the real scripts and show the screens the jury will see |

Step 3 still includes an early emulator check of `/ford_ranger.glb` and one canvas, before polishing Gradle. That check is inside the shell step, not a phase that precedes the JSON.

## Scaling Considerations

This product is one sideloaded APK for a jury, not a multi-user service. User-count tiers are the wrong axis.

| Scale | Architecture adjustments |
|-------|--------------------------|
| One phone or emulator | Current shape. JSON in the bundle, GLB in `public/`, one WebView |
| Same APK on a slower phone | First bottleneck is the GLB and the 2048 shadow map on the WebGL context, not React or the JSON. Do not split the data module to chase that |
| A second platform later | `cap add` another platform against the same `dist/`. Still no API. Out of scope for this milestone |

### Scaling priorities

1. **First bottleneck:** WebView memory while a canvas is mounted. The shell must keep the existing rule: one canvas at a time. Do not leave the home canvas mounted under specs.
2. **Second bottleneck:** APK size from `public/ford_ranger.glb` plus the unused alternate GLBs if someone points `webDir` at the repo instead of `dist`. Only `dist/` is packaged. Alternate GLBs and `public/scratch/` are copied only if they sit in `public/` — they do today, so they will ride into the APK. Moving scratch assets out of `public/` is a packaging concern for the shell step, not a data-model change.

## Anti-Patterns

### Fetching the JSON from `public/`

**What people do:** Put `ranger.json` in `public/` and `fetch('/ranger.json')` when a screen mounts.
**Why it's wrong:** It adds a failure mode the import does not have, and it makes every screen async. The milestone needs the facts inside the APK with no network.
**Do this instead:** Import `src/data/ranger.js`. Vite bundles the object.

### Treating `canGoBack` or React Router as the back stack

**What people do:** On `backButton`, call `window.history.back()` because the Capacitor sample does, or add a router so history exists.
**Why it's wrong:** This app never pushes history, so `canGoBack` is false and the sample exits immediately. A router replaces `src/App.jsx`, which this milestone is not allowed to redesign.
**Do this instead:** Map the button onto `setPage` in the page shell.

### A design-system package to “share tokens”

**What people do:** Add Tailwind, styled-components, or a component kit so the three screens share colors.
**Why it's wrong:** Tokens already exist on `:root`. A second styling system leaves the CSS Modules in place and duplicates the accent again.
**Do this instead:** Point the modules at `var(--accent)` and `var(--bg)`. Add a component only for markup that is already repeated.

### Painting the status bar with `StatusBar.setBackgroundColor`

**What people do:** Install `@capacitor/status-bar` and set the bar color to the accent.
**Why it's wrong:** On Capacitor 8, SystemBars is the edge-to-edge API and it does not support `setBackgroundColor`. The Status Bar plugin’s overlay and background options stop working when the app targets Android 16.
**Do this instead:** `backgroundColor` in `capacitor.config.json` plus `--bg` on the page. `SystemBars` style `DARK` for light icons.

### Changing the GLB URL when adding Capacitor

**What people do:** Set Vite `base` to `'./'`, or move the GLB into `src/` and leave `useGLTF('/ford_ranger.glb')` as written.
**Why it's wrong:** The fetch string is not rewritten by `base`. A hashed file name will 404 inside the WebView. A non-http Android scheme breaks path resolution on current WebViews.
**Do this instead:** Keep the file in `public/` and the absolute URL. Keep `androidScheme` at the default `https`.

### Shipping the visual demo inside the APK

**What people do:** Drop the three screenshots in `public/` so they are easy to open.
**Why it's wrong:** Vite copies `public/` into `dist/`, and `cap sync` copies `dist/` into the APK.
**Do this instead:** `docs/screenshots/`, linked from the README.

## Integration Points

### External services

| Service | Integration pattern | Notes |
|---------|---------------------|-------|
| None for product data | JSON is compiled in | Spreadsheet at the repo root stays offline input for whoever edits the JSON. The app does not parse xlsx |
| Google Fonts | Remove | Replace the `@import` in `src/index.css` with vendored `@font-face` during the token step |
| Gradle / Android SDK | Builds the APK from `android/` after `cap sync` | Not a runtime dependency of `src/` |

### Internal boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `android/` ↔ `dist/` | `cap sync` file copy | One direction. Native code does not call React |
| `App.jsx` ↔ `src/native/androidBack.js` | Listener calls `setPage` | Only on `Capacitor.getPlatform() === 'android'` |
| `App.jsx` ↔ screens | Callback props | Unchanged. Back button does not go through screen props; it uses the same `setPage` the props close over |
| `ranger.js` ↔ three screens | ES module import | Screens do not import one another’s catalogs |
| `SpecsPage` camera tables ↔ `ranger.json` | `viewId` string only | Poses stay in the screen. Unknown ids still must exist in `VIEWS` |
| `index.css` ↔ CSS Modules | `var(--*)` | Includes safe-area variables injected by SystemBars |
| `index.css` ↔ `theme.js` and `capacitor.config.json` | Manual hex copy of `--bg` and `--accent` | No build step that generates one from the other |
| `FordRangerRaptor` ↔ both canvases | Same component, public URL | Shell does not wrap the canvas |
| README ↔ app | None at runtime | Written after the scripts and the three screens exist |

## Sources

- Capacitor config schema (`webDir`, `backgroundColor`, `server.androidScheme` default `https`, `server.hostname` default `localhost`, SystemBars plugin since 8.0.0): https://capacitorjs.com/docs/config — fetched 2026-09-27, docs default version v8. Confidence HIGH.
- Capacitor workflow (`npx cap sync` copies the built web bundle from `webDir`): https://capacitorjs.com/docs/basics/workflow — Confidence HIGH.
- SystemBars (`insetsHandling: css`, style enum `Dark` = light content on a dark background, no `setBackgroundColor`): https://capacitorjs.com/docs/apis/system-bars — Confidence HIGH.
- App plugin `backButton` (listener disables the default handler; `canGoBack` is the WebView history flag): https://capacitorjs.com/docs/apis/app — Confidence HIGH.
- Status Bar plugin limits on Android 16 / Capacitor 8 (`overlaysWebView` and `backgroundColor` no longer apply): https://github.com/ionic-team/capacitor-plugins/blob/main/status-bar/README.md — Confidence HIGH.
- `@capacitor/core` npm `version` 8.5.2 on 2026-09-27. The docs version switcher lists a v9, which is not the published latest. Confidence HIGH for pinning the shell work to Capacitor 8.
- Vite 8 JSON imports: https://github.com/vitejs/vite/blob/v8.0.10/docs/guide/features.md (section JSON) — Confidence HIGH. Project is on Vite `^8.0.12`.
- Vite `public/` copied as-is to the dist root and referenced with a root-absolute path: https://github.com/vitejs/vite/blob/v8.0.10/docs/guide/assets.md — Confidence HIGH.
- Repo map for the shell this attaches to: `.planning/codebase/ARCHITECTURE.md` and `.planning/codebase/STRUCTURE.md` (2026-09-26). Current call sites checked in `src/App.jsx`, `src/index.css`, `src/App.css`, `src/components/FordRangerRaptor.jsx`, `HeroUI.jsx`, `SpecsPage.jsx`, `ReportPage.jsx`.

**Open for the shell phase, not for this structure:** whether this GLB and a 2048 shadow map hold a steady frame on the jury emulator. That is a runtime check after `cap sync`, not a reason to change the component boundaries. Confidence MEDIUM until that run exists.

---
*Architecture research for: Capacitor shell, bundled JSON, shared tokens on the existing Ranger Raptor SPA*
*Researched: 2026-09-27*
