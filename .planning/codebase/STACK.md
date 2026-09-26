# Technology Stack

**Analysis Date:** 2026-09-26

## Languages

**Primary:**
- JavaScript (ES modules, JSX) — all application code under `src/`. Entry is `src/main.jsx`. Components are `.jsx`. There is no TypeScript source and no `tsconfig.json`. `"type": "module"` is set in `package.json`.

**Secondary:**
- CSS — global styles in `src/index.css` and `src/App.css`; component styles as CSS modules (`src/components/*.module.css`). Vite 8 compiles CSS with Lightning CSS (`lightningcss` is a Vite dependency in `package-lock.json`).
- HTML — `index.html` (Vite entry shell) and `public/scratch/view.html` (static mesh-screenshot gallery, not part of the app).
- Python — one-off mesh splitter `split_glb.py`. It imports `trimesh`. There is no `requirements.txt` or `pyproject.toml`; `trimesh` is not a project dependency.
- PowerShell — one-off color rewrites `replace_colors2.ps1` and `replace_colors3.ps1`. Hardcoded to a Windows path (`C:\Users\artur\Desktop\Challenge_Mobile\src`). Not part of `npm` scripts.
- CommonJS (`.cjs`) — browser-automation scripts `capture_meshes.cjs` and `get_logs.cjs`. Both `require('puppeteer')`. Puppeteer is not listed in `package.json`.

`@types/react` and `@types/react-dom` are devDependencies for editor checking only. Do not add a TypeScript compile step unless the project is migrated; new UI code stays `.jsx`.

## Runtime

**Environment:**
- Browser SPA. `eslint.config.js` sets `globals.browser`. The 3D view needs WebGL (`<Canvas>` from `@react-three/fiber` in `src/components/CarViewer.jsx` and `src/components/SpecsPage.jsx`).
- Node.js for the dev server, production build, and lint. No `engines` field in `package.json` and no `.nvmrc`. Constraints come from locked tools:
  - Vite 8.0.12 (`package-lock.json`): `node: ^20.19.0 || >=22.12.0`
  - ESLint 10.3.0 (`package-lock.json`): `node: ^20.19.0 || ^22.13.0 || >=24`
  - Use a Node version that satisfies both: `^20.19.0`, `^22.13.0`, or `>=24`.
- No server runtime. The app does not start an API, database client, or SSR process.

**Package Manager:**
- npm — inferred from `package-lock.json` (`lockfileVersion` 3). No `packageManager` field. No `yarn.lock` or `pnpm-lock.yaml`.
- Lockfile: `package-lock.json` present. Install with `npm install`. Do not add a second lockfile.
- npm CLI version is not pinned.

## Frameworks

**Core:**
- React 19.2.6 — UI. Mounted with `createRoot` and `<StrictMode>` in `src/main.jsx`. Page state is a single `useState('home' | 'specs' | 'report')` in `src/App.jsx`. No router library.
- React DOM 19.2.6 — DOM renderer. The root node is `#root` in `index.html`.
- `@react-three/fiber` 9.6.1 — React renderer for Three.js. Use `<Canvas>`, `useThree`, and `useFrame` (see `src/components/SpecsPage.jsx`).
- `@react-three/drei` 10.7.7 — Three.js helpers. Used helpers: `OrbitControls`, `Environment`, `ContactShadows`, `Grid`, `useGLTF`, `useProgress`. Peer range in the lockfile: `@react-three/fiber` ^9, `react` ^19, `three` >=0.159.
- `three` 0.184.0 — WebGL scene graph. Materials are built in `src/components/FordRangerRaptor.jsx` (`MeshPhysicalMaterial`, `MeshStandardMaterial`, `MeshBasicMaterial`).
- `recharts` 3.8.1 — charts on the report and specs screens (`src/components/ReportPage.jsx`, `src/components/SpecsPage.jsx`).

**Testing:**
- Not detected. `package.json` scripts are `dev`, `build`, `lint`, and `preview` only. No Jest, Vitest, Playwright, Cypress, or Testing Library dependency. No `*.test.*` or `*.spec.*` files.

**Build/Dev:**
- Vite 8.0.12 — dev server (`npm run dev`), production bundle (`npm run build` → `dist/`, gitignored), and preview (`npm run preview`). Config is `vite.config.js` (React plugin only; no aliases, proxy, or `base`). Bundler inside Vite 8 is Rolldown 1.0.0 (`package-lock.json`).
- `@vitejs/plugin-react` 6.0.1 — JSX transform and Fast Refresh. `README.md` states this plugin uses Oxc, not Babel/SWC, for the app transform. The React Compiler is not enabled (`README.md`).
- ESLint 10.3.0 — `npm run lint` runs `eslint .`. Flat config in `eslint.config.js`. Extends `@eslint/js` recommended, `eslint-plugin-react-hooks` 7.1.1 (`reactHooks.configs.flat.recommended`), and `eslint-plugin-react-refresh` 0.5.2 (`reactRefresh.configs.vite`). `dist` is ignored. Lint targets `**/*.{js,jsx}`.

## Key Dependencies

**Critical:**
- `react` 19.2.6 / `react-dom` 19.2.6 — component model and DOM mount. Keep them on the same 19.x line; drei peers require React 19.
- `three` 0.184.0 — vehicle scene, PBR materials, and camera math. Import as `import * as THREE from 'three'` (see `src/components/FordRangerRaptor.jsx` and `src/components/SpecsPage.jsx`).
- `@react-three/fiber` 9.6.1 — puts the Three.js scene inside React. New 3D views go through `<Canvas>`, not a raw `WebGLRenderer`.
- `@react-three/drei` 10.7.7 — GLB loading (`useGLTF('/ford_ranger.glb')` in `src/components/FordRangerRaptor.jsx`) and the `city` environment preset. Preset HDRIs are fetched at runtime (see INTEGRATIONS.md). Transitive libraries such as `three-stdlib`, `zustand`, `@mediapipe/tasks-vision`, and `hls.js` come from drei; do not import them from app code unless a feature needs them.
- `recharts` 3.8.1 — comparison charts. Specs and competitor series are constants in the component files, not fetched.

**Infrastructure:**
- Vite 8.0.12 + Rolldown 1.0.0 — serve and bundle the SPA. Static files in `public/` are copied to the site root (`/ford_ranger.glb`, `/favicon.png`).
- `@vitejs/plugin-react` 6.0.1 — JSX and HMR.
- ESLint 10.3.0 plus `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` — the only automated quality gate.

## Configuration

**Environment:**
- No `.env`, `.env.example`, or `.env.local` files. No `import.meta.env` or `process.env` usage under `src/`.
- No required environment variables. Do not introduce secrets into the client bundle; this app has no backend to hold them.
- Runtime behavior is code and static assets only.

**Build:**
- `package.json` — name `ford-ranger-raptor-app`, private, version `0.0.0`, scripts above.
- `vite.config.js` — `defineConfig({ plugins: [react()] })`. Default Vite port 5173 is what `capture_meshes.cjs` and `get_logs.cjs` open (`http://localhost:5173`).
- `eslint.config.js` — flat config described above.
- `index.html` — title `Ford Vision`, favicon `/favicon.png`, module script `/src/main.jsx`.
- `package-lock.json` — exact versions. Treat the lockfile as the source of truth for versions listed here.
- `.gitignore` — ignores `node_modules`, `dist`, `dist-ssr`, `*.local`, logs, and editor folders. GLB files under `public/` are present on disk and are not ignored.

## Platform Requirements

**Development:**
- Node.js in the range shared by Vite and ESLint (`^20.19.0`, `^22.13.0`, or `>=24`) and npm.
- A browser with WebGL. The home and specs pages render a full-viewport canvas.
- `npm install` then `npm run dev`. No Docker, database, or API process.
- Optional and undeclared: Python with `trimesh` to re-run `split_glb.py`; Puppeteer to re-run `capture_meshes.cjs` / `get_logs.cjs`; PowerShell on Windows to re-run the color scripts. Do not add these to the app runtime.

**Production:**
- Static hosting of the `vite build` output (`dist/`). No hosting config is in the repo: no `Dockerfile`, `vercel.json`, `netlify.toml`, GitHub Actions workflow, or `base` path in `vite.config.js`.
- The deployed host must serve `public/` assets at the site root, especially `/ford_ranger.glb` (`useGLTF` and `useGLTF.preload` in `src/components/FordRangerRaptor.jsx`).
- The browser must be able to reach Google Fonts and the drei HDRI CDN (see INTEGRATIONS.md). There is no offline font or HDRI fallback in the repo.
- No Node server is required after the build.

---

*Stack analysis: 2026-09-26*
*Update after major dependency changes*
