# External Integrations

**Analysis Date:** 2026-09-26

## APIs & External Services

**Fonts:**
- Google Fonts — Bebas Neue and Inter (weights 300, 400, 500, 600)
  - Integration method: CSS `@import` in `src/index.css` (`https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap`). The browser then loads font files from Google (`fonts.gstatic.com`). `src/index.css` sets `font-family: 'Inter', sans-serif` on `html, body, #root`.
  - SDK/Client: none
  - Auth: none
  - Fallback: none in the repo. If the request is blocked, the UI falls back to the browser sans-serif.

**3D environment maps:**
- pmndrs drei-assets (via raw.githack.com) — image-based lighting for the vehicle
  - Where: `<Environment preset="city" />` in `src/components/CarViewer.jsx` and `src/components/SpecsPage.jsx`
  - SDK/Client: `@react-three/drei` 10.7.7 (`useEnvironment` inside the `Environment` component). The locked package resolves `preset="city"` to `potsdamer_platz_1k.hdr` and sets the loader path to `https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/` (drei `helpers/environment-assets.js` and `core/useEnvironment.js` at 10.7.7).
  - Auth: none
  - The HDRI is not vendored under `public/`. A new preset name still hits that CDN. To go offline, pass `files` and `path` to `<Environment>` with an HDRI in `public/` instead of `preset`.

**Payment, email, SMS, and other product APIs:**
- Not detected. No Stripe, SendGrid, maps, analytics, or vehicle-data HTTP client. No `fetch`, `axios`, `XMLHttpRequest`, or `WebSocket` under `src/`.

**Local scripts (not application integrations):**
- `split_glb.py` — local `trimesh` load of `public/ford_ranger.glb`, export to `public/ford_ranger_split.glb`. No network call. `trimesh` is not declared in the repo.
- `capture_meshes.cjs` and `get_logs.cjs` — Puppeteer against `http://localhost:5173` (the Vite dev server). Puppeteer is not in `package.json`. `capture_meshes.cjs` writes PNGs to a machine-local path outside this repo and calls `window.highlightMesh` (assigned in `src/components/FordRangerRaptor.jsx`).
- `replace_colors2.ps1` and `replace_colors3.ps1` — rewrite color literals in local source. No network.
- `FIAP-Ford - Data sheet_Desafio_01_v02.xlsx` (repo root) — spreadsheet sitting in the tree. Application code does not read it. Comparison numbers are constants in `src/components/ReportPage.jsx` (`RADAR_DATA`, `ENGINE_DATA`, `OVERALL_SCORES`, `FEATURES_COMPARISON`) and spec copy in `src/components/SpecsPage.jsx`.

## Data Storage

**Databases:**
- Not detected. No ORM, SQL, SQLite, Postgres, MongoDB, or Supabase client. Specs and competitor scores live as module-level constants in the JSX files above.

**File Storage:**
- Local static files served by Vite from `public/` and bundled from `src/assets/`. No S3, Cloudinary, or other object store.
  - Vehicle mesh: `public/ford_ranger.glb`, loaded by `useGLTF('/ford_ranger.glb')` and preloaded in `src/components/FordRangerRaptor.jsx`. Also on disk, unused by the app: `public/ford_ranger_grouped.glb`, `public/ford_ranger_split.glb`.
  - Textures on disk, not referenced by JSX: `public/textures/` (`ONIX_BLACK.jpg`, `METAL_NM.jpg`, `Tires_bm.jpg`, and others). Current materials are code-built in `MATERIAL_MAP` inside `src/components/FordRangerRaptor.jsx`.
  - UI images imported by the bundler: `src/assets/Ford-Logo-PNG-Isolated-Image.webp` (hero, loader, specs, report). Also present and unused by components: `src/assets/hero.png`, `src/assets/Frame 1.png`, `src/assets/react.svg`, `src/assets/vite.svg`.
  - Favicon: `public/favicon.png` linked from `index.html`. `public/favicon.svg` and `public/icons.svg` are not referenced by the app entry.
  - Scratch gallery: `public/scratch/*.png` and `public/scratch/view.html`. Dev artifact, not routed by `src/App.jsx`.

**Caching:**
- None as a service (no Redis, no service worker, no Cache Storage API).
- drei `useLoader` / `useGLTF` keeps the parsed GLB in memory for the session. `useGLTF.preload('/ford_ranger.glb')` starts that load before the specs page mounts. Browser HTTP cache applies to the GLB, Google Fonts, and the HDRI.

## Authentication & Identity

**Auth Provider:**
- Not detected. No login, session, JWT, cookie auth, or identity SDK. No `localStorage` or `sessionStorage` usage under `src/`.

**OAuth Integrations:**
- Not detected.

## Monitoring & Observability

**Error Tracking:**
- Not detected. No Sentry, Bugsnag, or similar. WebGL and load failures surface as unhandled browser errors.

**Analytics:**
- Not detected. No page-view or event client.

**Logs:**
- Browser devtools only. The app does not ship a logger. `src/components/ReportPage.jsx` calls `window.print()` for the comparison report; that is the print dialog, not a log pipeline.
- `get_logs.cjs` can print page `console` lines that contain `MESH:` while pointed at the local Vite server. Nothing in `src/` currently logs that prefix.

## CI/CD & Deployment

**Hosting:**
- Not configured. No Dockerfile, `vercel.json`, `netlify.toml`, `firebase.json`, or deploy script.
- Production artifact is a static Vite build: `npm run build` writes `dist/` (gitignored). Deploy that directory to any static host. Keep site-root URLs for `/ford_ranger.glb` and `/favicon.png` unless `vite.config.js` `base` is changed to match the host path.
- Dev server URL assumed by the Puppeteer scripts: `http://localhost:5173`.

**CI Pipeline:**
- Not detected. No `.github/workflows/`. Lint (`npm run lint`) and build (`npm run build`) are local only. There is no test job to wire up.

## Environment Configuration

**Development:**
- Required env vars: none
- Secrets location: no `.env*` files in the repo (`.gitignore` ignores `*.local` if one is added later). Do not commit secrets; the client bundle cannot hide them.
- Mock/stub services: none. Charts and specs are in-source constants. The only live external calls in the running app are Google Fonts and the drei `city` HDRI.

**Staging:**
- Not detected. No staging host, dataset, or env split.

**Production:**
- Secrets management: not applicable (no secrets).
- Failover: none. Fonts and the HDRI depend on Google and raw.githack.com. The GLB is same-origin with the static host.

## Webhooks & Callbacks

**Incoming:**
- None. No server routes. `src/App.jsx` switches pages with React state (`home`, `specs`, `report`); there is no URL router and no `/api` handler.

**Outgoing:**
- None. No webhook client, retry loop, or signed callback. `window.print()` in `src/components/ReportPage.jsx` opens the browser print dialog only.

---

*Integration audit: 2026-09-26*
*Update when adding/removing external services*
