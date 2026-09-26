# Codebase Structure

**Analysis Date:** 2026-09-26

## Directory Layout

```
Challenge_Mobile/
├── public/                 # Static files served at /
│   ├── scratch/            # Mesh-identification screenshots and a local viewer
│   ├── textures/           # Image maps shipped beside the GLB (not referenced by src/)
│   ├── ford_ranger.glb     # Runtime vehicle model
│   ├── ford_ranger_grouped.glb
│   ├── ford_ranger_split.glb
│   ├── favicon.png
│   ├── favicon.svg
│   └── icons.svg
├── src/                    # Application source
│   ├── assets/             # Images imported by Vite (logo and unused template art)
│   ├── components/         # Screens, 3D viewer, model, CSS Modules
│   ├── App.jsx             # Page shell
│   ├── App.css             # Full-viewport frame
│   ├── index.css           # Reset and design tokens
│   └── main.jsx            # React entry
├── .planning/              # GSD planning documents (this map lives here)
├── index.html              # HTML shell
├── vite.config.js          # Vite + React plugin
├── eslint.config.js        # ESLint flat config
├── package.json            # Scripts and dependencies
├── package-lock.json       # npm lockfile
├── capture_meshes.cjs      # Puppeteer mesh screenshots
├── get_logs.cjs            # Puppeteer console filter
├── split_glb.py            # Offline GLB splitter
├── replace_colors2.ps1     # One-off color rewrite
├── replace_colors3.ps1     # One-off color rewrite
├── README.md               # Vite template readme
└── .gitignore
```

The challenge spreadsheet `FIAP-Ford - Data sheet_Desafio_01_v02.xlsx` sits at the repo root. The app does not import it.

## Directory Purposes

**`public/`:**
- Purpose: Files copied as-is and requested by URL
- Contains: GLB models, favicons, `textures/`, `scratch/`
- Key files: `public/ford_ranger.glb` (the only model loaded at runtime, via `useGLTF('/ford_ranger.glb')` in `src/components/FordRangerRaptor.jsx`), `public/favicon.png` (linked from `index.html`)
- Subdirectories: `public/textures/` (jpg/png maps), `public/scratch/` (png captures plus `public/scratch/view.html`)

**`src/`:**
- Purpose: Everything Vite bundles
- Contains: `main.jsx`, `App.jsx`, global CSS, `assets/`, `components/`
- Key files: `src/main.jsx`, `src/App.jsx`, `src/index.css`, `src/App.css`
- Subdirectories: `src/assets/`, `src/components/`

**`src/assets/`:**
- Purpose: Images imported from JavaScript so Vite hashes them
- Contains: `.webp`, `.png`, `.svg`
- Key files: `src/assets/Ford-Logo-PNG-Isolated-Image.webp` (imported by `HeroUI.jsx`, `LoaderUI.jsx`, `SpecsPage.jsx`, `ReportPage.jsx`)
- Subdirectories: None. `hero.png`, `Frame 1.png`, `react.svg`, and `vite.svg` are template leftovers and are not imported by `src/`

**`src/components/`:**
- Purpose: All UI and all 3D React components. Flat; no feature subfolders
- Contains: `*.jsx` components and co-located `*.module.css`
- Key files: `CarViewer.jsx`, `FordRangerRaptor.jsx`, `HeroUI.jsx`, `LoaderUI.jsx`, `SpecsPage.jsx`, `ReportPage.jsx`, plus `HeroUI.module.css`, `LoaderUI.module.css`, `SpecsPage.module.css`, `ReportPage.module.css`
- Subdirectories: None

**Repo root scripts:**
- Purpose: Offline asset and color work, outside the Vite graph
- Contains: `capture_meshes.cjs`, `get_logs.cjs`, `split_glb.py`, `replace_colors2.ps1`, `replace_colors3.ps1`
- Key files: `split_glb.py` reads `public/ford_ranger.glb` and writes `public/ford_ranger_split.glb`. `capture_meshes.cjs` calls `window.highlightMesh` on a local dev server
- Subdirectories: None

## Key File Locations

**Entry Points:**
- `index.html`: Document shell, `#root`, module script `/src/main.jsx`
- `src/main.jsx`: `createRoot` and `StrictMode` render of `App`
- `src/App.jsx`: Page switch for home, specs, and report
- `vite.config.js`: Dev/build config (`plugins: [react()]` only)

**Configuration:**
- `package.json`: npm scripts `dev`, `build`, `lint`, `preview`; dependencies `react`, `three`, `@react-three/fiber`, `@react-three/drei`, `recharts`
- `package-lock.json`: Locked npm tree
- `eslint.config.js`: Flat ESLint config for `**/*.{js,jsx}`, ignores `dist`
- `.gitignore`: Ignores `node_modules`, `dist`, `dist-ssr`, logs, and editor folders
- `src/index.css`: Global CSS variables (`--bg`, `--accent`, `--text-primary`, and related)

**Core Logic:**
- `src/App.jsx`: Navigation state
- `src/components/CarViewer.jsx`: Home WebGL scene and orbit controls
- `src/components/FordRangerRaptor.jsx`: GLB load, placement, `MATERIAL_MAP`
- `src/components/SpecsPage.jsx`: Specs canvas, `VIEWS`, `NAV_CATEGORIES`, `SPECS_DATA`, `COMPONENTS`, `CameraController`
- `src/components/ReportPage.jsx`: Comparison data, Recharts, CSV/TXT/PDF export
- `src/components/HeroUI.jsx`: Home copy and teaser spec list
- `src/components/LoaderUI.jsx`: Load progress overlay (`useProgress` from drei)

**Testing:**
- Not detected. No `tests/` directory, no `*.test.*` or `*.spec.*` files, and no test script in `package.json`

**Documentation:**
- `README.md`: Default Vite + React template text. It does not describe Ford Vision screens or the GLB pipeline
- `.planning/codebase/`: Generated codebase maps (architecture and structure)

## Naming Conventions

**Files:**
- `PascalCase.jsx` for React components: `src/components/SpecsPage.jsx`, `src/components/CarViewer.jsx`
- `PascalCase.module.css` co-located with the component: `src/components/ReportPage.module.css`
- Global CSS is a short lowercase name: `src/index.css`, `src/App.css`
- Root utilities are `snake_case` with a runtime suffix: `capture_meshes.cjs`, `split_glb.py`, `replace_colors2.ps1`
- Public models are `snake_case.glb`: `public/ford_ranger.glb`
- Mesh ids inside the GLB stay `wire_` plus digits (`wire_134110008`). Use those strings as keys in `MATERIAL_MAP`

**Directories:**
- Lowercase plural for collections: `src/components/`, `src/assets/`, `public/textures/`, `public/scratch/`
- No feature folders. A new screen is a sibling file in `src/components/`, not `src/components/specs/`

**Special Patterns:**
- Default export only. No barrel `index.js` under `src/` or `src/components/`
- CSS Module import name is `styles`: `import styles from './HeroUI.module.css'`
- Page components that replace the whole shell use the `*Page` suffix: `SpecsPage`, `ReportPage`
- Overlay pieces on the home canvas use a role suffix: `HeroUI`, `LoaderUI`, `CarViewer`
- The model file is the vehicle name: `FordRangerRaptor.jsx`. Keep that filename; the default function inside it is currently declared as `FordF150` — new code should match the filename
- Camera and catalog ids are `snake_case` strings, including Portuguese words: `geral_lateral`, `rodas_dianteira`, `caçamba`
- Competitor ids are short English keys: `raptor`, `hilux`, `amarok`, `s10`, `l200`

## Where to Add New Code

**New screen (new `page` value):**
- Primary code: `src/components/{Name}Page.jsx`
- Styles: `src/components/{Name}Page.module.css`
- Wire-up: add the state value and a conditional render in `src/App.jsx`. Pass `onHome` and `onBack` the same way `SpecsPage` and `ReportPage` receive them
- Tests: Not detected — no test tree exists

**New home overlay (chrome on top of the hero canvas):**
- Implementation: a new `src/components/{Name}UI.jsx` plus `{Name}UI.module.css`
- Mount it inside the `page === 'home'` branch in `src/App.jsx`, as a sibling of `CarViewer` and `HeroUI`, so it stays DOM-overlay and not a child of `<Canvas>`

**New specs camera or explorable part:**
- Camera pose: add a key to `VIEWS` and a child id under `NAV_CATEGORIES` in `src/components/SpecsPage.jsx`
- Part card: add an object to `COMPONENTS` in the same file (`id`, `viewId`, `title`, `specs`, `score`, `competitors`)
- Do not add a second canvas. The specs `<Canvas>` already hosts `CameraController`

**New material / mesh treatment:**
- Implementation: `MATERIAL_MAP` and, if the shading type is new, `buildMaterial` in `src/components/FordRangerRaptor.jsx`
- Model file: replace or add GLBs under `public/` and point `useGLTF` / `useGLTF.preload` at the public URL (`/filename.glb`)

**New comparison metric or upgrade:**
- Data and UI: top-of-file constants in `src/components/ReportPage.jsx` (`ENGINE_DATA`, `FEATURES_COMPARISON`, `CATEGORY_GRADES`, `UPGRADE_RECOMMENDATIONS`)
- If the same number must also appear on the hero or specs screen, import one shared module from both screens instead of copying the literal

**New route or command:**
- Not applicable. There is no router and no CLI. Navigation is the `page` state in `src/App.jsx`

**Utilities:**
- Shared helpers: none exist. A helper used by more than one component belongs in a new `src/` module (for example `src/scene.jsx` for the duplicated light/grid/shadow rig). Do not put runtime helpers in the repo-root `.cjs` / `.py` scripts
- Type definitions: Not applicable. The project is JavaScript with JSX, not TypeScript. `@types/react` is present only as a dev dependency

**Static image used by a component:**
- Import it from `src/assets/` (bundled)
- Files that the GLB or a raw URL must fetch go in `public/` and are referenced as `/name.ext`

## Special Directories

**`public/scratch/`:**
- Purpose: Debug stills of individual `wire_*` meshes and `view.html` to flip through them
- Source: Manual or Puppeteer captures (`capture_meshes.cjs` writes to a machine-local path, not into this folder)
- Committed: Yes

**`public/textures/`:**
- Purpose: Source textures that belong with the vehicle asset
- Source: Art pipeline. No `src/` file references these paths; materials are rebuilt in `src/components/FordRangerRaptor.jsx`
- Committed: Yes

**`public/ford_ranger_split.glb` and `public/ford_ranger_grouped.glb`:**
- Purpose: Alternate model outputs. Split file is what `split_glb.py` writes
- Source: Offline tooling
- Committed: Yes. Runtime code loads `public/ford_ranger.glb` only

**`dist/`:**
- Purpose: `vite build` output
- Source: Generated by Vite
- Committed: No (listed in `.gitignore`)

**`node_modules/`:**
- Purpose: Installed npm packages
- Source: `npm install` from `package-lock.json`
- Committed: No

**`.planning/`:**
- Purpose: Planning and codebase-map documents for the GSD workflow
- Source: Written by mapping and planning commands
- Committed: Yes, when the planning tree is checked in

---

*Structure analysis: 2026-09-26*
