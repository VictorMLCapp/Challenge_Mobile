# Feature Research

**Domain:** Challenge-jury sideload APK wrapped around an existing Ford Ranger Raptor browser showcase (home, specs, report)
**Researched:** 2026-09-27
**Confidence:** MEDIUM

The three screens already run in the browser. This landscape is what a jury expects when that same app is handed over as an installable Android package, with one visual identity, one offline data file, and a reviewable repo. The audience is a challenge jury, not Play Store users. Missing a table-stakes row is grounds to reject the delivery. A differentiator raises the demonstration. An anti-feature spends the milestone on something the brief already ruled out.

## Feature Landscape

### Table Stakes (Users Expect These)

Features the jury assumes exist. Missing these means the APK is not a finished delivery.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Debug-signed sideload APK | The jury installs a file on a phone or emulator. An unsigned release APK will not install. A Play App Bundle is the wrong artifact. | MEDIUM | Capacitor's own path is `npm run build`, then `npx cap sync`, then `npx cap run android` for a debug install, or `npx cap build android` when a signed binary is required. Debug builds are the sideload vehicle. `webDir` must be Vite's `dist` (the directory that contains `index.html`), not the Ionic default `www`. Document `adb install` and a current emulator image. |
| Shipped app loads bundled files, never the dev machine | A jury phone is not on the author's LAN. A committed live-reload URL opens a blank WebView as soon as the laptop is off. | LOW | Capacitor live reload writes `server.url` (and often `cleartext: true`) into config and tells you not to commit it. The config that produces the APK has no `server.url`. Sync again after the last web build so `android/` does not contain a stale `dist`. |
| Home, specs, and report finish on a phone-sized WebView | Those three flows are the product. A crash, a stuck loader, or a specs sheet covering the explorer means the flow did not run. | MEDIUM | Capacitor supports API 24+ with a System WebView at Chrome 60 or newer, and warns that the emulator WebView does not update itself. Target a current system image (or a phone with an updated WebView), not the API 24 floor. This app's specs layout already breaks at `max-width: 700px` by pinning the spec sheet over the component explorer. Phone width is the jury's viewport. Cap the canvas pixel ratio so a 9.2 MB GLB plus 2048 shadow maps does not kill the WebView. |
| Offline closure for the three flows | The brief is an APK with no server. The model, the lighting, and the type must resolve from inside the package. | MEDIUM | `useGLTF('/ford_ranger.glb')` is already local. `<Environment preset="city" />` is not: drei documents presets as CDN fetches (`potsdamer_platz_1k.hdr`) and says the preset is not for production. `src/index.css` loads Inter and Bebas Neue from Google Fonts. Vendor one HDR and those two families, and point `Environment` at `files`. A failed HDRI is also what keeps the current loader up forever. |
| One existing visual identity on all three screens | The jury compares inicio, especificações, and relatório in one sitting. Three unrelated palettes read as three unfinished apps. | LOW | Tokens already exist in `src/index.css` (`--bg`, `--surface`, `--accent`, `--text-primary`, `--ford-blue`, and the rest). Apply that set and the same logo, type scale, and button treatment to every screen. Do not invent a second palette. Header links that go nowhere (`Modelos`, `Configurar`, `Dealer`, `Solicitar Proposta`) should be removed or left out of the visible chrome. Building destinations for them is an anti-feature. |
| One bundled JSON as the only vehicle-fact source | Power, torque, and rivals are copied across hero, specs, and report today, and they already disagree (fuel, competitor set, scores). The jury will notice. | MEDIUM | Import a module such as `src/data/ranger.json` from the three screens so Vite inlines it. Do not `fetch` it at runtime. Reconciling the contradictory copies is the actual work; the import itself is small. The spreadsheet stays an authoring input, not a runtime dependency. |
| Presentable package and source | Reviewers open the repo and the installed app. A Vite starter README, a component named `FordF150`, and workshop files inside the APK fail that look. | LOW | Product names on the launcher (`app_name`), the model component, and the export filenames. Screen components read the JSON; they do not own the fact tables. Root workshop scripts (`capture_meshes.cjs`, `split_glb.py`, `replace_colors*.ps1`) stay off the runtime path. `public/scratch`, the unused split GLB, and loose textures must not be copied into `webDir` (that tree is tens of megabytes the renderer never asks for). |
| README a reviewer can execute, with one still per screen | The delivery is judged from the repo as well as the phone. The current README is the Vite template. | LOW | Prerequisites (Node in the Vite/ESLint range, JDK, Android SDK), `npm install`, `npm run dev`, the production build, `npx cap sync`, and the debug install. One image of home, one of specs, one of report, taken from the flows the APK actually runs. |

### Differentiators (Competitive Advantage)

Not required for the jury to accept the APK. Worth doing when the table stakes already run on a device.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Export the juror can take off the phone | CSV/TXT today use a blob URL and `<a download>`. That pattern is a desktop download. On a WebView it often does nothing visible, so the report buttons look dead. | MEDIUM | Smallest fix that matches the existing buttons: write the text and open the Android share sheet (`@capacitor/filesystem` and/or `@capacitor/share`), with the browser blob path kept for `npm run dev`. Confidence on the WebView download gap is MEDIUM (device behavior, not a Capacitor guarantee). A hand-off the juror can open is the differentiator; a silent success toast is not. |
| CSV and print that match what is on screen | The jury may open the file in Excel or print the charts. Today's CSV score block is mis-aligned, there is no UTF-8 BOM, and `window.print()` runs before print colors commit. | MEDIUM | Do this only after a file actually leaves the phone. BOM plus one score row per competitor. Print waits until the print palette has rendered. `window.print()` itself is a weak Android feature; do not replace it with a PDF library. |
| Back returns to the screen that opened the report | Home → Relatório → Voltar currently always lands on specs. On a phone that is the main way out. | LOW | Remember the previous page. The logo can keep going home. |
| Launcher chrome in the existing background | Android 12+ shows a small icon on a solid color, not a full-bleed splash. A white system splash then the dark loader looks like a crash. | LOW | Set Capacitor `backgroundColor` to the existing `--bg` (`#080a0e`). Generate the adaptive icon from the mark already in the app with `@capacitor/assets` only if a 1024 px source exists. Do not design a new splash illustration. |
| One 3D stage for home and specs | Lighting, the environment, contact shadows, and the grid are duplicated. The two canvases already disagree (only home casts the extra spot shadow). | MEDIUM | Extract the current stage and pass orbit vs scripted camera. Same vehicle, two modes. This is consistency, not a new look. |
| Phone stills or a short clip in the README | Desktop screenshots hide the WebView layout, the loader, and the share sheet. A capture from the emulator is what the jury will try to repeat. | LOW | Shot after the APK runs. A clip is optional on top of the three stills that are table stakes. |

### Anti-Features (Commonly Requested, Often Problematic)

Do not build these for this milestone.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Play Store listing, AAB, Play App Signing, privacy policy, Appflow | "Ship it properly" and Capacitor's Android publishing guide point at Google Play. | The jury sideloads. Store target SDK, signing, and policy work do not make the three flows run. | Debug-signed APK, `adb install` or a file-manager install, documented in the README. |
| Accounts, API, analytics, push, Firebase | Mobile apps are expected to phone home. | No accounts exist. A backend makes the demonstration depend on a network the brief forbids. | Bundled JSON and local assets only. |
| Read the xlsx (or a Google Sheet) at runtime | The datasheet is the obvious source of truth. | SheetJS or a network fetch reintroduces a server and a second parser. The app already has the numbers, copied. | Export once into `ranger.json` and import that module. |
| New screens for Modelos, Configurar, Dealer, or Solicitar Proposta | The home header already shows the links. | The chosen challenge is three flows. New routes are a different product. | Remove the dead controls. Keep home, specs, and report. |
| Visual redesign or a component library | Unifying CSS is easily mistaken for a rebrand. | A new system (Tailwind rebuild, MUI, a second type ramp, dark mode) throws away the identity the jury should recognize across screens. | Restyle the three screens with the tokens already in `src/index.css`. |
| Rewrite in Expo or React Native | An APK "should" be a native UI toolkit. | The showcase is WebGL through react-three-fiber. That viewer does not move to React Native without a rewrite. | Capacitor WebView around the existing Vite build. |
| iOS target | Capacitor makes `cap add ios` look free. | The delivery artifact is an APK. An Xcode project doubles native upkeep for a jury that will not install it. | Android only. |
| PWA, service worker, or a second install path | Offline is often solved with a service worker. | Two caches (Workbox and the Capacitor asset copy) drift, and a service worker does not help the sideload. | Copy the production `dist` into the APK. No service worker. |
| Live reload left in the shipped config | Faster device iteration. | Official live-reload setup points the WebView at `http://<lan-ip>:<port>`. Committed, the jury APK is a remote control for a machine that is off. | Use live reload only on a local, uncommitted config. The committed config has no `server.url`. |
| In-app PDF engine | `window.print()` is awkward on Android, so jsPDF looks like the fix. | A second renderer for charts and tables, with its own fonts and page breaks, for a button the report already has. | Share the CSV/TXT text. Leave print as print. |
| Custom URL schemes, deep links, in-app updates | Native wrappers invite them. | This navigation is a `useState` of `'home' \| 'specs' \| 'report'`, not a URL router. Deep links and code push add a release channel the jury will not use. | In-app state only. Ship a new APK if the bundle changes. |
| Device-farm E2E as a delivery gate | Confidence before the jury. | There is no test runner today. A device lab is a project of its own. | One manual pass on an emulator or phone: loader, orbit, specs cameras and parts, report charts, export, back. |
| i18n framework | The UI is Portuguese and the repo discussion is mixed. | A string catalog does not change what the jury sees. | Keep the copy that is on screen now. |

## Feature Dependencies

```
Vite production build (webDir = dist)
    └──requires──> cap sync of that dist
                       └──requires──> Debug-signed sideload APK
                                          └──requires──> Manual pass of the three flows on a phone or current emulator

Offline closure (local GLB + local HDR + self-hosted fonts)
    └──requires──> Three flows finish with no network
    └──requires──> Loader can dismiss (HDRI failure no longer blocks the hero)

Bundled ranger.json
    └──requires──> Same facts on home, specs, and report
    └──enhances──> Presentable source (fact tables leave the screen components)

Existing CSS tokens
    └──requires──> One visual identity
    └──enhances──> Phone layout (same chrome, reflowed)
    └──conflicts──> New design system or component library

Phone-width layout of the three screens
    └──requires──> "Flows run on a phone" (a desktop-only pass does not count)

README stills of each screen
    └──requires──> The three flows running in the build that will be synced

On-device share of CSV/TXT
    └──requires──> The sideload APK (browser blob download does not prove the WebView)
    └──enhances──> Excel-readable CSV and honest print colors

server.url / cleartext live reload
    └──conflicts──> Offline sideload APK

Play AAB and store signing
    └──conflicts──> Jury sideload artifact

Runtime xlsx or API
    └──conflicts──> Bundled JSON

New screens
    └──conflicts──> Three-flow scope

Shared 3D stage
    └──enhances──> One visual identity
    └──requires──> Local HDR (both canvases use the city preset today)
```

### Dependency Notes

- **Debug APK requires a synced `dist`:** Capacitor copies the built web assets into the native project. Changing React code without `npm run build` and `npx cap sync` leaves the phone on the previous bundle. Official workflow: build, sync, then `npx cap run android` or `npx cap build android`.
- **Offline closure requires local HDR and fonts, not only the GLB:** drei's `preset="city"` is documented as a CDN fetch and is explicitly not for production. Google Fonts fail closed when the phone is offline, so the "one typography" claim fails with them. The stuck loader is tied to that same environment request.
- **One JSON requires a reconciliation pass:** The three screens do not currently hold the same facts. A shared file that re-exports three divergent objects does not meet the feature. Pick one record and delete the inline copies.
- **Phone layout requires the identity tokens, and blocks the APK demo:** Specs at `≤ 700px` covers the explorer with the spec sheet. Unifying colors on a layout that cannot be used still fails the phone pass.
- **README stills require the flows that ship:** Screenshots of `npm run dev` on a desktop, taken before the WebView layout and the offline assets land, demonstrate the wrong artifact.
- **On-device export requires the APK:** The share sheet cannot be validated in the desktop browser. Excel polish waits on a file that actually leaves the WebView.
- **Live reload conflicts with the sideload:** Capacitor's live-reload guide sets `server.url` to a LAN address and says not to commit that config. Shipping it makes the package depend on the author's machine.
- **A new design system conflicts with token unification:** The identity work is to apply `--bg`, `--accent`, Inter, and Bebas Neue everywhere. Replacing that set is a different milestone.
- **A shared 3D stage enhances identity and depends on the local HDR:** Home and specs each mount `<Environment preset="city" />`. Extracting one stage before the HDR is local just centralizes the network call.

## MVP Definition

The milestone is the jury handoff. "Launch" means the APK a reviewer can install. There is no v2 product.

### Launch With (v1)

Minimum the jury can accept.

- [ ] Debug-signed APK whose config has no `server.url`, built from a fresh `dist` via `cap sync`
- [ ] Home orbit, specs (cameras, tabs, components), and report charts completing on a phone or a current emulator, including at phone width
- [ ] GLB, environment map, and the two existing font families loaded from the package
- [ ] Colors and typography from the existing tokens on all three screens, with dead header actions gone
- [ ] `ranger.json` imported by home, specs, and report, with one reconciled fact set
- [ ] README with run, APK build, install, and one still of each screen
- [ ] Launcher name, component names, and export filenames aligned with Ranger Raptor; workshop output kept out of `webDir`

### Add After Validation (v1.x)

After the three flows survive a cold start with the network off.

- [ ] Share-sheet CSV/TXT on Android, browser download unchanged for `npm run dev` — trigger: the report buttons are part of the demo script
- [ ] UTF-8 BOM and a single aligned score table; print colors committed before `window.print()` — trigger: a juror will open the file
- [ ] Back target stored so Relatório returns to the screen that opened it — trigger: the phone demo uses Voltar
- [ ] `backgroundColor` and, if a 1024 px source exists, an adaptive icon in the existing dark ground — trigger: the first frame is a white system splash
- [ ] One vehicle stage shared by home and specs — trigger: the two canvases disagree under the same HDR
- [ ] README captures taken on the emulator or phone — trigger: desktop stills are already in the doc and the WebView layout differs

### Future Consideration (v2+)

Out of this challenge. Do not schedule them.

- [ ] Play Store AAB, listing, and signing — the jury never opens the store
- [ ] Accounts, API, push, analytics — no backend by design
- [ ] Runtime spreadsheet or remote facts — conflicts with the bundled JSON
- [ ] Dealer, configure, models, or quote screens — outside the three flows
- [ ] Expo/React Native rewrite, iOS, PWA, deep links, in-app updates, PDF engine, i18n, device-farm E2E — each replaces or duplicates a path this delivery already has

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Debug-signed APK, no live-reload URL, synced `dist` | HIGH | MEDIUM | P1 |
| Three flows on a current phone/emulator, phone-width layout, capped canvas cost | HIGH | MEDIUM | P1 |
| Local GLB, HDR, and fonts | HIGH | MEDIUM | P1 |
| Existing tokens on all three screens; no dead controls | HIGH | LOW | P1 |
| One reconciled `ranger.json` | HIGH | MEDIUM | P1 |
| README plus one still per screen; names and `webDir` cleaned up | HIGH | LOW | P1 |
| On-device share of CSV/TXT | MEDIUM | MEDIUM | P2 |
| Excel-readable CSV and print colors | MEDIUM | MEDIUM | P2 |
| Back to the previous screen | MEDIUM | LOW | P2 |
| Splash/icon ground color matching `--bg` | MEDIUM | LOW | P2 |
| Shared 3D stage | MEDIUM | MEDIUM | P2 |
| Phone or emulator captures in the README | MEDIUM | LOW | P2 |
| Play Store, backend, new screens, redesign, Expo, iOS, PWA, PDF engine | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for the jury handoff
- P2: Should have once the APK boots offline
- P3: Not this milestone

## Competitor Feature Analysis

The comparison set is delivery patterns a challenge jury already sees, not other vehicle apps.

| Feature | Browser SPA only (this repo today) | Typical thin Capacitor wrap | Store-shaped submission | Our approach |
|---------|------------------------------------|-----------------------------|-------------------------|--------------|
| Install | Reviewer runs `npm run dev` and needs Node | APK installs, then loads `server.url` or Google Fonts | AAB, listing, signing, policies | Debug-signed APK, assets inside the package, no `server.url` |
| 3D | WebGL in Chrome, remote `city` HDRI | Same remote HDRI inside the WebView; fails offline; emulator WebView may be stale | Native rewrite, or the same WebView with store overhead | Keep react-three-fiber; local HDR; test on a current system image |
| Facts | Copied into three components, report says the data is mock | Same copies, now frozen in the APK | API or spreadsheet sync | One imported JSON, copies deleted |
| Visual system | Tokens in `index.css`, three CSS modules, dead header links | Unchanged, plus a white system splash | New mobile design system | Same tokens and type on every screen; splash ground uses `--bg` |
| Export | Blob download and `window.print()` in Chrome | Same buttons, often no visible result in the WebView | Native share plus a generated PDF | Browser download kept; Android share sheet for the same text. No PDF engine |
| Proof | Vite starter README | README still describes the web app | Store screenshots and a privacy policy | README with build, install, and one still of each screen |

## Sources

- Capacitor development workflow (build web assets, `npx cap sync`, `npx cap run android`, `npx cap build android` for a signed AAB/APK). Fetched 2026-09-27. HIGH. https://capacitorjs.com/docs/basics/workflow
- Capacitor Android runtime: API 24+, System WebView / Chrome 60+, emulator WebView does not auto-update, `npx cap add android`, `npx cap run android`. Fetched 2026-09-27. HIGH. https://capacitorjs.com/docs/android
- Capacitor configuration: `appId`, `appName`, `webDir` must contain the built `index.html`, `backgroundColor`, `android.allowMixedContent` not for production. Fetched 2026-09-27. HIGH. https://capacitorjs.com/docs/config
- Capacitor getting started: existing web app needs `package.json`, a build directory such as `dist`, and `index.html` at the root of that directory with a `<head>`. Fetched 2026-09-27. HIGH. https://capacitorjs.com/docs/getting-started
- Capacitor live reload: `server.url` plus `cleartext` points the WebView at a LAN dev server; do not commit that config. Fetched 2026-09-27. HIGH. https://capacitorjs.com/docs/guides/live-reload
- Capacitor splash screens and icons: `@capacitor/assets`, Android 12+ uses a smaller icon on a colored background. Fetched 2026-09-27. HIGH. https://capacitorjs.com/docs/guides/splash-screens-and-icons
- Capacitor Android app name and application id live in `strings.xml` and `applicationId`. Fetched 2026-09-27. HIGH. https://capacitorjs.com/docs/android/configuration
- Capacitor Play publishing guide delegates to the Google Play launch checklist. Used as evidence that store release is a different job from sideload. Fetched 2026-09-27. HIGH. https://capacitorjs.com/docs/android/deploying-to-google-play
- `@capacitor/filesystem` for writing files on device. Relevance to export is analogical; the plugin does not document HTML `<a download>`. Fetched 2026-09-27. MEDIUM for the export recommendation. https://capacitorjs.com/docs/apis/filesystem
- drei `Environment`: `preset="city"` loads `potsdamer_platz_1k.hdr` from a CDN and "is not meant to be used in production." `files` loads a local HDR. HIGH. https://github.com/pmndrs/drei/blob/master/docs/staging/environment.mdx
- This repo: remote fonts and the city preset (`src/index.css`, `src/components/CarViewer.jsx`, `src/components/SpecsPage.jsx`); fact copies and the mock footer (`.planning/codebase/CONCERNS.md`); blob CSV/TXT and `window.print()` (`src/components/ReportPage.jsx`). HIGH for the current-app claims.
- WebView `<a download>` / blob URL often producing no file manager download. MEDIUM. Not stated in the Capacitor pages above; confirm on the first emulator pass before treating share-sheet export as mandatory rather than P2.

---
*Feature research for: challenge-jury sideload APK of the Ford Ranger Raptor showcase*
*Researched: 2026-09-27*
