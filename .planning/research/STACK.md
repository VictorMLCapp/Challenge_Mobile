# Stack Research

**Domain:** Sideload Android APK around the existing Ford Ranger Raptor Vite/React/WebGL SPA, plus one bundled JSON data module and shared visual tokens
**Researched:** 2026-09-27
**Confidence:** HIGH

The SPA toolchain stays as mapped in `.planning/codebase/STACK.md` (React 19.2.6, Vite 8.0.12, `@react-three/fiber` 9.6.1, `@react-three/drei` 10.7.7, `three` 0.184.0, Recharts 3.8.1). This document only adds the wrapper, the data module, the offline type files, and the demo artifact. Do not upgrade those SPA packages in the same change as Capacitor. A white screen would then have two causes.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| `@capacitor/core` | 8.5.2 | WebView bridge. Also ships the SystemBars API used for edge-to-edge insets | Current stable Capacitor. Copies the Vite `dist/` into an Android WebView, so the existing WebGL canvas keeps running. Capacitor 9 is `9.0.0-alpha.7` (published 2026-09-18) and changes the SystemBars inset default; do not adopt an alpha for a jury APK | HIGH |
| `@capacitor/android` | 8.5.2 | Native Android project (`android/`) | Official Android host. Peer is `@capacitor/core` `^8.5.0`. Core, CLI, and Android must be installed together; Capacitor publishes them as one release | HIGH |
| `@capacitor/cli` | 8.5.2 (dev) | `cap init`, `cap add android`, `cap sync`, `cap run`, `cap build` | Generates the native project from the 8.5.2 template and copies `webDir` into it. Requires Node `>=22.0.0` | HIGH |
| `@capacitor/app` | 8.1.1 | Hardware back button | The SPA navigates with `useState`, so the WebView history stack stays at one entry. `backButton` on this plugin is how the APK moves report → specs → home, then exits. It is not part of `@capacitor/core` | HIGH |
| Vite JSON import | already in Vite 8.0.12 | The only vehicle-data source | `import data from './ranger.json'` inlines the object into the JS bundle. No fetch, no plugin, no runtime file read. Official Vite 8 behavior, including named root fields | HIGH |
| `@fontsource/inter` | 5.3.0 | Self-hosted Inter 300/400/500/600 | Same families the app already requests from Google Fonts. Weight CSS files keep `font-family: 'Inter'` and the existing numeric weights. The files ride inside `dist/` and then the APK, so type does not fall back to a generic sans when the phone is offline | HIGH |
| `@fontsource/bebas-neue` | 5.3.0 | Self-hosted Bebas Neue 400 | The current Google Fonts URL loads Bebas Neue at its default weight. `400.css` matches that. Do not switch the UI to a variable font | HIGH |

SystemBars is not a separate npm package. It is bundled in `@capacitor/core` since 8.0.0 (`SystemBars` export, documented in the `system-bars.md` shipped inside core 8.5.2). Do not add `@capacitor/status-bar`. On Android 16 that plugin's `setBackgroundColor` and `overlaysWebView` do not apply. SystemBars is the edge-to-edge API, and it does not paint the bar; the page background does.

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| `androidx.activity:activity` | 1.11.0 (already the template pin `androidxActivityVersion`) | `EdgeToEdge.enable(this)` | Capacitor 8 does not call this for you. Core's SystemBars doc says to call it from the activity `onCreate` when `insetsHandling` is not `disable`. Capacitor 9 will do it automatically. Add an `implementation` line on the app module so `MainActivity` can import the class; `capacitor-android` already depends on this artifact but does not re-export it | HIGH |
| City HDRI file `potsdamer_platz_1k.hdr` | the file drei 10.7.7 already requests | Offline image-based lighting | Not an npm package. Copy it into `public/hdri/` and point the existing `<Environment>` at `files="/hdri/potsdamer_platz_1k.hdr"`. Drop `preset="city"`. Drei's `files` prop is the supported local-HDR path. The preset fetches `raw.githack.com` and will not resolve in an offline WebView | HIGH |
| `@capacitor/assets` | 3.0.5 (dev, optional) | Launcher icon and splash from one source image | Only if the default Capacitor icon is unacceptable. Not required for the three screens or the README gallery | HIGH |

No new UI, state, routing, or chart library. Colors and type already live as custom properties in `src/index.css` (`--bg: #080a0e`, `--accent: #f54b2e`, Inter, and the rest). CSS Modules consume those variables. Three.js `Color` cannot parse `var()`, so the few WebGL color literals stay JS constants that match the same hex values. That is a second spelling of an existing token, not a theme package.

### Development Tools

| Tool | Purpose | Notes | Confidence |
|------|---------|-------|------------|
| Node.js `>=22.13.0` | Dev server, Vite build, Capacitor CLI, ESLint | Capacitor CLI engines are `>=22.0.0`. Vite 8.0.12 accepts `^20.19.0 \|\| >=22.12.0`. ESLint 10.3.0 on the 22 line wants `^22.13.0`. The overlap is `>=22.13.0` (22 LTS at 22.13 or newer, or 24+). Node 20 cannot run the Capacitor CLI. Do not add a second package manager | HIGH |
| Android Studio Otter 2025.2.1 or newer | SDK, emulator, JDK | Capacitor 8's environment guide requires this minimum. Studio installs the JDK. Do not install a separate JDK and do not point Gradle at a random system Java | HIGH |
| Android SDK Platform 36 | Compile and test target | Template `variables.gradle` at tag 8.5.2 sets `minSdkVersion = 24`, `compileSdkVersion = 36`, `targetSdkVersion = 36`. API 24 is the install floor, not the test target. Test on an API 36 system image (or a phone with a current Android System WebView) so WebGL runs in a current Chromium | HIGH |
| Android Gradle Plugin 8.13.0 and Gradle 8.14.3 | Build the APK | These are the versions in the Capacitor 8.5.2 `android-template` (`build.gradle` and `gradle-wrapper.properties`). `cap add android` writes them. Do not bump or downgrade them by hand | HIGH |
| `./gradlew assembleDebug` | The sideload file | Writes `android/app/build/outputs/apk/debug/app-debug.apk`, signed with the machine debug keystore, installable with `adb install -r`. `npx cap build android` defaults `releaseType` to `AAB` (CLI source, `@default "AAB"`). An AAB is a Play Store artifact and is not what the jury installs | HIGH |

### Capacitor config to commit

Write `capacitor.config.json`. This repo has no `typescript` dependency, and `cap init` emits JSON in that case (`init.ts`: TypeScript config only when the `typescript` package resolves). Do not add TypeScript so the config can be `.ts`.

```json
{
  "appId": "com.fiap.rangerraptor",
  "appName": "Ford Ranger Raptor",
  "webDir": "dist",
  "backgroundColor": "#080a0e",
  "android": {
    "buildOptions": {
      "releaseType": "APK"
    }
  },
  "plugins": {
    "SystemBars": {
      "insetsHandling": "css",
      "style": "DARK",
      "initialViewportFitValueHint": "cover"
    }
  }
}
```

- `webDir` must be `dist`. The CLI default is `www`. Sync fails, or ships the wrong folder, if this is left alone.
- `backgroundColor` is the WebView backdrop (config field since 1.1.0). `#080a0e` is the existing `--bg`, so the first frame is not white.
- Leave `server.androidScheme` unset. The default is `https`, and `server.hostname` defaults to `localhost`. The origin is `https://localhost`, which is why `/ford_ranger.glb` and Vite's default `base: '/'` resolve. WebView 117+ cannot rewrite paths on a custom scheme. Do not set the scheme to anything other than `https`.
- Do not commit `server.url` or `server.cleartext`. Those keys point the WebView at a dev machine. A jury phone then opens a blank app.
- `insetsHandling: "css"` is already the 8.5.2 default. Set it anyway. The same doc says Capacitor 9 will default this to `native`. `style: "DARK"` is light icons on the dark page. `initialViewportFitValueHint: "cover"` matches a `viewport-fit=cover` meta tag and avoids a first-frame jump. Pair it with that meta tag in `index.html`.
- `releaseType: "APK"` overrides the CLI default of AAB for `cap build`. The day-to-day jury file is still the debug APK from `assembleDebug`, which does not need a release keystore.

`MainActivity` stays a Java subclass of `BridgeActivity` (the template). Before `super.onCreate`, call `EdgeToEdge.enable(this)`. Do not convert the activity to Kotlin.

Leave Vite `base` at `/`. `base: './'` does not rewrite the string `'/ford_ranger.glb'` inside `useGLTF`, and the https localhost server does not need relative asset URLs.

### npm scripts

```json
{
  "android:sync": "vite build && cap sync android",
  "android:run": "vite build && cap sync android && cap run android",
  "apk:debug": "vite build && cap sync android && cd android && ./gradlew assembleDebug"
}
```

Order is fixed: Vite build, then `cap sync`. Sync copies `dist/` into `android/app/src/main/assets/public`, which the Android template gitignores. Commit the `android/` project. Do not commit `local.properties`, `.gradle/`, `android/app/build/`, or `*.apk`.

## Installation

```bash
# Runtime: bridge, Android host, back button, offline fonts
npm install @capacitor/core@8.5.2 @capacitor/android@8.5.2 @capacitor/app@8.1.1 @fontsource/inter@5.3.0 @fontsource/bebas-neue@5.3.0

# CLI only
npm install -D @capacitor/cli@8.5.2

# JSON config, webDir dist. Emits capacitor.config.json because typescript is not installed.
npx cap init "Ford Ranger Raptor" com.fiap.rangerraptor --web-dir dist

# Then replace the generated config with the JSON block above, and:
npx cap add android
```

Font entry, in place of the Google Fonts `@import` in `src/index.css`:

```js
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/bebas-neue/400.css'
```

Data entry, from each screen (or from one `src/data/ranger.js` that re-exports the JSON):

```js
import ranger from './ranger.json'
```

Do not add a JSON plugin, `resolveJsonModule`, or an `assert { type: 'json' }` import. Vite 8 accepts the default import.

Optional launcher artwork, not part of the screen demo:

```bash
npm install -D @capacitor/assets@3.0.5
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Capacitor 8.5.2 | Capacitor 7.6.9 | Only an existing Capacitor 7 app that cannot move Android Studio yet. This repo has no native project, so start on 8 |
| Capacitor 8.5.2 | Capacitor 9.0.0-alpha.7 | When 9 is stable and the SystemBars `native` inset default is what you want. Not for this delivery |
| Debug APK (`assembleDebug`) | `cap build android --androidreleasetype APK` with a local keystore | When the jury rejects a debug-signed package. Still an APK. Still not an AAB. Keep the keystore out of git (the template's `*.jks` / `*.keystore` ignores are commented out; uncomment them) |
| `capacitor.config.json` | `capacitor.config.ts` | If the repo is later migrated to TypeScript. Do not migrate for this file |
| `@fontsource/inter` weight files | `src/assets/fonts` plus hand-written `@font-face` | If a pinned npm font package is unwanted. The bytes are the same idea. Fontsource is the versioned form and matches the weights already in the CSS |
| `@fontsource/inter` static weights | `@fontsource-variable/inter` 5.3.0 | If the CSS is rewritten around a variable font. That is a type change this milestone does not need |
| Vite `import` of `src/data/ranger.json` | A JSON file in `public/` loaded with `fetch` | Never for this app. Fetch adds a loading state the screens do not have, and it is a second way to fail inside the WebView |
| CSS variables already in `src/index.css` | Tailwind, styled-components, vanilla-extract, Ionic React | If the product were being redesigned. It is not |
| System WebView inside Capacitor | A native GL surface or a React Native GL view | If the viewer were rewritten. The constraint is that the current canvas stays |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Expo, React Native, `react-native-webview` as a rewrite | The viewer is `@react-three/fiber` on a browser canvas. React Native does not run that tree. A WebView-inside-RN app would be Capacitor with an extra framework | Capacitor 8 around the existing Vite build |
| Cordova, PhoneGap, Crosswalk | Crosswalk is dead. Cordova is the legacy container Capacitor replaced. The 8.5.2 template still has an empty `capacitor-cordova-android-plugins` folder; leave it empty | `@capacitor/android` 8.5.2 |
| Ionic React (`@ionic/react`) and Ionic's UI CSS | A component kit replaces the screens. The milestone unifies the tokens that already exist | CSS variables in `src/index.css` and the current CSS Modules |
| Trusted Web Activity / Bubblewrap | TWA loads a hosted URL and is aimed at Play, including Digital Asset Links. This delivery is a bundled `dist/` with no server | Capacitor `webDir: "dist"` |
| Tauri 2 Android | A second toolchain (Rust) and a different shell. Capacitor is the maintained WebView wrapper whose Android template was verified at tag 8.5.2 | Capacitor |
| `npx cap build android` with the default release type | The CLI default is AAB. The jury cannot sideload an AAB | `assembleDebug`, or `releaseType: "APK"` |
| Play App Signing, a store listing, `bundleRelease` | Out of scope. Sideload only | Debug APK or a locally signed release APK |
| `@capacitor/status-bar` for bar color | `setBackgroundColor` / `overlaysWebView` do not apply on Android 16 edge-to-edge | SystemBars in `@capacitor/core`, plus `backgroundColor` and `--bg` |
| `server.url` committed for live reload | The installed APK then depends on the author's laptop | Build, sync, install the APK |
| `androidScheme` other than `https` | WebView 117+ does not apply path changes on custom schemes, so `/assets/...` and `/ford_ranger.glb` break | Default `https` |
| `base: './'` in Vite | Does not fix the hardcoded GLB URL and is unnecessary on `https://localhost` | Vite default `base: '/'` |
| Fetching JSON, `@capacitor/filesystem`, SQLite, Axios, SheetJS | The spreadsheet is an authoring input. The running app has one module | `src/data/ranger.json` imported by Vite |
| Zod, AJV, or a schema package | One static file checked by reading the three screens. A validator is a new runtime for a file that cannot change at runtime | The JSON module |
| `vite-plugin-pwa`, Workbox, a service worker | The APK is the offline package. A service worker is a second cache with its own update bugs | `cap sync` of `dist/` |
| Storybook, Histoire, or Puppeteer as a project dependency | The visual demo is three pictures in the README. Puppeteer is already an undeclared one-off script and stays that way | PNGs in `docs/screenshots/`, linked from `README.md`. Capture from `npm run preview` or `adb exec-out screencap`. Do not put those PNGs in `public/` or they are copied into the APK |
| Disabling hardware acceleration | Android enables it by default. The WebGL canvas is the system WebView's Chromium, not a native GL plugin. Turning acceleration off is how the canvas goes black | Leave the manifest alone. Do not set `android:hardwareAccelerated="false"` |
| A native WebGL plugin, Expo GL, or a second Three.js build | The canvas already works in Chromium. The APK hosts that Chromium via the system WebView | Existing `<Canvas>` from `@react-three/fiber` |
| Adding the iOS platform | Needs macOS and Xcode 26, and the delivery is an APK | `npx cap add android` only |
| Upgrading Vite to 8.3.1, or moving React / fiber / drei / three, in this milestone | Latest Vite on npm as of 2026-09-27 is 8.3.1. The lockfile is 8.0.12 and it already builds the SPA. Changing it while adding the shell makes a bad APK undiagnosable | Keep the locked SPA versions |

## Stack Patterns by Variant

**If the jury installs a file on a phone or emulator:**
- Use `npm run apk:debug` and `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`
- Because `assembleDebug` is signed with the debug keystore and needs no Play upload key

**If a release signature is required and Play still is not:**
- Use `npx cap build android --androidreleasetype APK` and a local keystore
- Because the config default above is APK, and AAB remains the wrong file

**If the 3D view must match the browser with the network off:**
- Vendor Inter, Bebas Neue, and `potsdamer_platz_1k.hdr`
- Because those are the only runtime network calls left (Google Fonts and the drei `city` preset). The GLB is already in `public/`

**If `public/` still contains scratch galleries and unused GLBs:**
- Move them out of `public/` before the first sync
- Because Vite copies all of `public/` into `dist/`, and `cap sync` copies `dist/` into the APK. `webDir` pointed at the repo root would be worse; it must stay `dist`

**If the WebView is API 24-era or an emulator image whose WebView never updates:**
- Test on an API 36 image or a phone with a current system WebView
- Because the floor in `variables.gradle` is only the minimum install SDK. WebGL for this scene is the device WebView, and Capacitor does not bundle Chromium

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@capacitor/core@8.5.2` | `@capacitor/cli@8.5.2`, `@capacitor/android@8.5.2` | Install all three at 8.5.2. Android's peer is `^8.5.0`. Do not mix a 7.x plugin |
| `@capacitor/app@8.1.1` | `@capacitor/core@8.5.2` | App is on the 8.1 line; it is not published in lockstep with core's 8.5.2 patch. Stay on 8.x |
| `@capacitor/cli@8.5.2` | Node `>=22.13.0` | CLI floor is `>=22`. ESLint 10.3.0 tightens the 22 line to `^22.13.0`. Vite 8.0.12 accepts that range |
| Capacitor Android template 8.5.2 | AGP 8.13.0, Gradle 8.14.3, `compileSdk`/`targetSdk` 36, `minSdk` 24, `androidx.webkit` 1.14.0, Android Studio 2025.2.1+ | Taken from the template at tag `8.5.2` and the v8 environment and upgrade docs. 8.5's own breaking notes are iOS-only (UIScene). Android pins stay the 8.0 set |
| Vite `base: '/'` | `server.androidScheme` default `https` | Root-absolute URLs hit `https://localhost/...`. Do not combine a custom scheme with the current GLB path |
| `@react-three/drei@10.7.7` `<Environment files>` | A local `.hdr` under `public/` | `preset="city"` stays a CDN fetch. `files` selects the HDR loader by extension. Do not pass `preset` and `files` together |
| `@fontsource/inter@5.3.0` | Existing `font-family: 'Inter'` and weights 300–600 | Import `300.css`, `400.css`, `500.css`, `600.css`. Those files exist in the 5.3.0 package. Bebas Neue 5.3.0 publishes `400.css` |
| SystemBars `insetsHandling: "css"` | `viewport-fit=cover` and padding via `var(--safe-area-inset-*)` | Default in core 8.5.2. WebView versions before Chromium 140 misreport `env(safe-area-inset-*)`; the `css` mode injects the `--safe-area-inset-*` variables for that case. `EdgeToEdge.enable` is still required in app code on Capacitor 8 |
| SPA lockfile (React 19.2.6, Vite 8.0.12, fiber 9.6.1, drei 10.7.7, three 0.184.0, Recharts 3.8.1) | This Capacitor shell | No peer conflict with Capacitor. Do not bump them to "whatever npm latest is" while adding the shell |

## Sources

- npm registry, 2026-09-27 — `@capacitor/core` latest `8.5.2` (next `9.0.0-alpha.7` on 2026-09-18); `@capacitor/cli` 8.5.2 engines `node: >=22.0.0`; `@capacitor/android` 8.5.2 peer `@capacitor/core@^8.5.0`; `@capacitor/app` 8.1.1; `@capacitor/status-bar` 8.0.3; `@fontsource/inter` and `@fontsource/bebas-neue` 5.3.0; `@capacitor/assets` 3.0.5; Vite latest 8.3.1 (not adopted). Confidence HIGH.
- `@capacitor/core@8.5.2` package file `system-bars.md` — SystemBars is bundled in core since 8.0.0; `insetsHandling` default `css`; `EdgeToEdge.enable` is called by the app on Capacitor 8 and by the runtime starting in Capacitor 9; Status Bar `setBackgroundColor` / `setOverlaysWebView` are the legacy API. Confidence HIGH.
- https://capacitorjs.com/docs/getting-started/environment-setup (docs version v8, fetched 2026-09-27) — Node 22+, Android Studio 2025.2.1+, SDK platform API 24 or greater, latest stable Android 16 (API 36), JDK comes with Studio. Confidence HIGH.
- https://capacitorjs.com/docs/updating/8-0 (v8 docs, fetched 2026-09-27) — `minSdk` 24, `compileSdk`/`targetSdk` 36, AGP 8.13.0, Gradle 8.14.3, `androidx.webkit` 1.14.0, Android Studio Otter 2025.2.1. Confidence HIGH.
- https://capacitorjs.com/docs/updating/8-5 (v8 docs, fetched 2026-09-27) — 8.5 breaking changes are iOS UIScene only. Confidence HIGH.
- Git tag `ionic-team/capacitor` `8.5.2`, `android-template/` — `variables.gradle`, `build.gradle` (AGP 8.13.0), `gradle-wrapper.properties` (Gradle 8.14.3), `AndroidManifest.xml` (`INTERNET`, `configChanges` including `density`), `MainActivity.java` extends `BridgeActivity`, `.gitignore` ignores `*.apk`, `build/`, `local.properties`, and `app/src/main/assets/public`. Confidence HIGH.
- https://github.com/ionic-team/capacitor/blob/8.5.2/cli/src/declarations.ts — `webDir` is the compiled asset directory; `androidScheme` default `https`; `hostname` default `localhost`; `android.buildOptions.releaseType` default `AAB`; `backgroundColor` since 1.1.0. Confidence HIGH.
- https://github.com/ionic-team/capacitor/blob/8.5.2/cli/src/config.ts — omitted `webDir` falls back to `www`. Confidence HIGH.
- https://github.com/ionic-team/capacitor/blob/8.5.2/cli/src/tasks/build.ts — `androidreleasetype` falls back to config then `'AAB'`. Confidence HIGH.
- https://github.com/ionic-team/capacitor/blob/8.5.2/cli/src/tasks/init.ts — new config is JSON unless the `typescript` package is installed. Confidence HIGH.
- https://capacitorjs.com/docs/basics/workflow (v8, fetched 2026-09-27) — `npm run build`, then `npx cap sync`, then `npx cap run android`. Confidence HIGH.
- https://capacitorjs.com/docs/cli/commands/build (v8, fetched 2026-09-27) — `--androidreleasetype` is `AAB` or `APK`. Confidence HIGH.
- https://capacitorjs.com/docs/config (v8, fetched 2026-09-27) — JSON config is the documented non-TypeScript form; Android custom schemes other than `http`/`https` break routing after WebView 117. Confidence HIGH.
- https://github.com/ionic-team/capacitor/blob/8.5.2/android/capacitor/src/main/java/com/getcapacitor/BridgeActivity.java — no `EdgeToEdge.enable` call. Confidence HIGH.
- https://github.com/ionic-team/capacitor/blob/8.5.2/android/capacitor/build.gradle — `implementation "androidx.activity:activity:$androidxActivityVersion"`. Confidence HIGH.
- https://vite.dev/guide/features (fetched 2026-09-27) — JSON default import and named root fields; `public/` files are served from the site root. Confidence HIGH.
- https://github.com/pmndrs/drei/blob/master/docs/staging/environment.mdx via Context7 `/pmndrs/drei` (fetched 2026-09-27) — `<Environment files="file.hdr" />` chooses the loader by extension. Confidence HIGH.
- `.planning/codebase/INTEGRATIONS.md` (2026-09-26) — `preset="city"` resolves to `potsdamer_platz_1k.hdr` on `raw.githack.com` at drei 10.7.7; Google Fonts `@import` in `src/index.css`. Confidence HIGH for this repo.
- `src/index.css` (read 2026-09-27) — token values to preserve, including `--bg: #080a0e` and `--accent: #f54b2e`. Confidence HIGH.
- https://developer.android.com/guide/topics/graphics/hardware-accel (fetched 2026-09-27) — hardware acceleration is enabled by default. Confidence HIGH.
- jsDelivr package file list for `@fontsource/inter@5.3.0` and `@fontsource/bebas-neue@5.3.0` (fetched 2026-09-27) — `300.css`/`400.css`/`500.css`/`600.css` and Bebas `400.css` are published. Confidence HIGH.

---
*Stack research for: Capacitor 8 sideload APK around the existing Vite/React/WebGL SPA*
*Researched: 2026-09-27*
