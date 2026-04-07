# Cleveland Metroparks Maps

New React/TypeScript frontend for the Cleveland Metroparks public maps web app, replacing the legacy jQuery-based application.

## Stack

- **React 18** + **TypeScript**
- **Vite** (build tool, dev server on port 3002)
- **Mantine v6** (UI components)
- **Mapbox GL** + **react-map-gl** (mapping)
- **TanStack React Query v4** (API data caching)
- **FlexSearch** (client-side full-text search)
- **React Router v6** (routing/URL state)
- **Axios** (HTTP client)

## Setup

### 1. Install dependencies

```bash
cd new
npm install
```

### 2. Configure environment

Create `new/.env.local`:

```
VITE_MAPBOX_TOKEN=your_mapbox_access_token
# Optional overrides:
# VITE_MAPBOX_MAP_STYLE_URL=mapbox://styles/...
# VITE_MAPBOX_PHOTO_STYLE_URL=mapbox://styles/...
# VITE_MAPS_API_BASE_URL=https://maps-api.clevelandmetroparks.com
# VITE_MAPS_API_BASE_PATH=api/v1
# Feature flags (default off):
# VITE_ENABLE_TRANSIT_DIRECTIONS=true
# VITE_ENABLE_TRAIL_ENDPOINT_MARKERS=true
```

### 3. Run

```bash
npm run dev
```

App available at **http://localhost:3002**

## Scripts

| Command                    | Description                                          |
| -------------------------- | ---------------------------------------------------- |
| `npm run dev`              | Start dev server                                     |
| `npm run build`            | Production build → `dist/`                           |
| `npm run lint`             | ESLint (zero warnings enforced)                      |
| `npm run type-check`       | TypeScript check (no emit)                           |
| `npm run test:a11y`        | Playwright keyboard + axe accessibility smoke checks |
| `npm run test:a11y:headed` | Run Playwright accessibility suite in headed mode    |
| `npm run preview`          | Preview production build locally                     |

## Deployment

- Deployment strategy and setup notes live in `DEPLOYMENT.md`.
- Automated deploys are handled by GitHub Actions with self-hosted runners on the target VMs.
- Branch mapping:
  - `develop` -> `dev`
  - `main` -> `prod`

## Playwright Testing

- Install browser binaries once after dependency install:
  - `npx playwright install chromium`
- Test config: `playwright.config.ts`
- Test folders:
  - `e2e/smoke/` fast high-value checks
  - `e2e/regression/` broader coverage, including `fixme` map-style-dependent tests
- Shared deterministic API mocks live in `e2e/helpers/mockApi.ts`.

## Project Structure

```
new/
├── public/                   Static assets (logo, activity icons, manifest)
│   └── images/activities/    Activity icon SVGs
├── src/
│   ├── App.tsx               App entry — single "/" route
│   ├── main.tsx              React DOM entry point
│   ├── theme.ts              Mantine theme overrides
│   ├── components/
│   │   ├── Layout.tsx        Context providers + Mantine AppShell
│   │   ├── MapView.tsx       Mapbox GL initialization + map interactions
│   │   ├── Sidebar.tsx       Collapsible vertical navigation + panels
│   │   ├── FloatingSearch.tsx Search bar floating over the map
│   │   └── panels/           One file per sidebar panel
│   │       └── details/      Feature detail panes (Park, Trail, Attraction)
│   ├── contexts/             React context providers
│   ├── hooks/                Data fetching + URL sync hooks
│   ├── lib/
│   │   ├── api.ts            API client + all endpoint functions
│   │   ├── dataTransform.ts  API response → typed model transformations
│   │   ├── mapUtils.ts       Map utility helpers
│   │   ├── searchUtils.ts    Search helpers (coordinate parsing, etc.)
│   │   └── wktUtils.ts       WKT geometry parsing for directions
│   └── types/api.ts          All TypeScript interfaces
├── vite.config.ts
└── tsconfig.json
```

## Architecture Overview

### Layout

The app is a full-viewport map with a collapsible sidebar on the left. The sidebar contains vertical tab navigation (expandable to 200px, collapsible to 76px) and lazy-loaded content panels.

### Data

All API data is fetched once on load and cached by React Query. The API lives at `https://maps-api.clevelandmetroparks.com/api/v1/`. Data types: Parks (reservations), Attractions, Trails, Activities, Categories.

### Search

Client-side full-text search is built with FlexSearch, indexing parks, attractions, and trails by name. If no local results are found, the search falls back to address geocoding via the API. Coordinate input (lat/lng pairs) is also supported.

### URL State

The app maintains two parallel URL state systems:

- **Map position** (`lat`, `lng`, `zoom`, `base`): updated via `window.history.replaceState` during pan/zoom — no history pollution
- **Feature selection** (`type`, `gid`, `activityId`): updated via React Router — back button returns to previous feature

A shared URL (copy/paste) restores both the exact map view and the selected feature.

### Directions

Four transport modes: `hike`, `bike`, `car` (Bing driving), `bus` (Bing transit). Directions can be initiated from any feature detail pane.

**Routing logic for `hike` and `bike`:**

Features selected from the autocomplete or pre-filled from a detail pane carry a `reservationId` identifying which park they belong to. Manually typed or geocoded addresses are treated as outside the park system.

| Scenario                                         | Behavior                                                                                                         |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Both endpoints in the **same park**              | Native trail routing only (`directions_trails`)                                                                  |
| Both endpoints **outside** the park system       | Error: "Both To and From are non-Metroparks locations"                                                           |
| One inside + one outside, or **different parks** | Native and Mapbox called in parallel; native result used if it succeeds, Mapbox walking/cycling used as fallback |

`car` and `bus` modes always use their respective Bing endpoints regardless of park association.

## Developer Notes

- **Debug panel**: Type `showDebugPanel()` in the browser console to reveal the hidden Debug tab.
- **Path alias**: `@/` resolves to `src/`.
- **Code splitting**: All sidebar panels are lazy-loaded. Mapbox GL, React/Mantine, and Turf.js each have their own build chunk.
- **Volta**: Node and npm versions are pinned in `package.json` via Volta.
