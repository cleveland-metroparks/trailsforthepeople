# Cleveland Metroparks Maps — New Frontend

React/TypeScript rewrite of the public-facing jQuery maps app. Replaces the legacy jQuery-based map at the same URL.

## Commands

```bash
npm run dev          # Start dev server at http://localhost:3001
npm run build        # tsc + vite build → dist/
npm run lint         # ESLint (zero warnings enforced)
npm run type-check   # tsc --noEmit (no emit, type errors only)
```

## Environment Variables

Create `.env.local` in `new/`:

```
VITE_MAPBOX_TOKEN=<required>         # Mapbox GL access token
VITE_MAPBOX_STYLE_URL=<optional>     # Override default map style URL
VITE_MAPS_API_BASE_URL=<optional>    # Default: https://maps-api.clevelandmetroparks.com
VITE_MAPS_API_BASE_PATH=<optional>   # Default: api/v1
```

## Architecture

```
Layout.tsx                   ← 6 context providers + Mantine AppShell
├── MapView.tsx              ← Mapbox GL init, click/hover, map instance → MapContext
└── Sidebar.tsx              ← Collapsible vertical nav (200px/76px) + lazy panels
    ├── SearchPanel
    ├── ParksPanel
    ├── ActivitiesPanel
    ├── TrailsPanel
    ├── DirectionsPanel
    ├── SharePanel
    └── CreditsPanel / DebugPanel
```

### Context Providers (nesting order in Layout.tsx)
1. `MapProvider` — holds `mapboxgl.Map` instance; shared to child components
2. `MapSelectionProvider` — `selectionTick` counter to trigger feature selection effects
3. `MapHoverProvider` — hover state (lngLat, point, features)
4. `SearchProvider` — search term, results, autocomplete, FlexSearch index readiness
5. `DirectionsProvider` — directions target, via mode, open/close request IDs
6. `SidebarProvider` — collapsed state, navWidth, `onSearchSubmit` callback

All context hooks throw if used outside their provider.

### URL State — Two Separate Systems

**Do not mix these up:**

| | Map Position | Feature Selection |
|---|---|---|
| Hook | `useMapURLSync` | `useURLState` |
| Params | `lat`, `lng`, `zoom`, `base` | `type`, `gid`, `activityId`, `fromSearch` |
| Mechanism | `window.history.replaceState` | React Router `setSearchParams` |
| History | No entries (replaces) | Adds entries (back button works) |
| Why | Map fires 60×/s during pan — can't use React Router | Discrete user actions need back button |

`useURLState.setParams` reads from `window.location.search` directly (not React Router's internal state) to preserve map position params when updating feature params.

### Data Flow

```
API (axios, useMapConfig for baseURL)
  → React Query cache (TanStack Query v4)
    → useParksData / useTrailsData / useActivitiesData / useCategoriesData
      → dataTransform.ts (normalize pipe-delimited strings, strToBool, add icons)
        → useSearchIndex (FlexSearch Document index, rebuilt on data change)
          → SearchContext
```

Search fallback: if FlexSearch finds no results, geocodes via API (`geocode/{address}`).

### API Endpoints

Base: `https://maps-api.clevelandmetroparks.com/api/v1/`

| Endpoint | Returns |
|---|---|
| `reservations` | Parks/reservations list |
| `attractions` | Points of interest |
| `activities` | Activity types with icons |
| `trails` | Trails (status=0 filtered out) |
| `categories` | Category types |
| `reservation_boundaries` | GeoJSON park boundaries |
| `trail_geometries/{id}` | Trail line geometry |
| `geocode/{address}` | Geocode an address |
| `directions_driving` | Car directions (Bing) |
| `directions_transit` | Bus directions (Bing) |
| `directions_trails` | Trail directions (internal, needs `via=hike\|bike`) |

### Mapbox Layer IDs (hardcoded in MapView.tsx)

Click/hover interactivity is scoped to specific layer IDs. Search for these before adding new interaction logic:

- Attraction layers: `'Attractions 1'`, `'Attractions 2'`, `'Attractions 3'`, `'Park Amenities'`
- Attraction group layers: `'Attraction Groups 1'`, `'Attraction Groups 2'`, `'Attraction Groups 3'`, `'Attraction Groups Outliers'`
- Clicking a group layer zooms in (flyTo zoom 16.5) instead of opening a detail pane

### Directions Flow

`DirectionsContext` uses request ID counters (`openRequestId`, `closeRequestId`) rather than booleans to trigger Sidebar tab changes. Sidebar watches these with `useEffect` + `useRef` to detect increments.

Via modes → API endpoints:
- `'car'` → `directions_driving`
- `'bus'` → `directions_transit`
- `'hike'` | `'bike'` → `directions_trails?via=<mode>`

### Build / Code Splitting (vite.config.ts)

Manual chunks: `mapbox-gl` (own chunk), `react-vendor` (React + Mantine + Emotion together — must stay bundled to avoid init order issues), `turf-vendor`, `vendor`. All sidebar panels are lazy-loaded.

## Key Files

```
src/
  App.tsx                               Single route: "/"
  components/
    Layout.tsx                          Context providers + AppShell
    MapView.tsx                         Map init, click/hover handlers
    Sidebar.tsx                         Tab nav, panel mounting, expand/collapse
    FloatingSearch.tsx                  Floating search bar over the map
    panels/
      SearchPanel.tsx                   Search UI + result list
      ParksPanel.tsx                    Parks list + detail
      ActivitiesPanel.tsx               Activity filter + attraction list
      TrailsPanel.tsx                   Trails list + detail
      DirectionsPanel.tsx               Directions form + results
      SharePanel.tsx                    Share URL panel
      details/
        FeatureDetailLayout.tsx         Shared detail pane wrapper
        ParkDetailPane.tsx
        TrailDetailPane.tsx
        AttractionDetailPane.tsx
  contexts/                             All React contexts (one file each)
  hooks/
    useURLState.ts                      Feature-selection URL params
    useMapURLSync.ts                    Map-position URL params
    useMapConfig.ts                     Mapbox token + style config
    useSearchIndex.ts                   FlexSearch index builder
    useParksData.ts / useTrailsData.ts  React Query data hooks
  lib/
    api.ts                              Axios client + all API functions
    dataTransform.ts                    Raw API → typed models
    mapUtils.ts                         Map utility helpers
    searchUtils.ts                      Search helpers (coord parsing, etc.)
    wktUtils.ts                         WKT geometry parsing
  types/api.ts                          All TypeScript interfaces
  theme.ts                              Mantine theme overrides
```

## Developer Tips

- **Debug panel**: Run `showDebugPanel()` in the browser console to reveal the hidden Debug tab.
- **Path alias**: `@/` resolves to `src/` (configured in vite.config.ts).
- **Image paths**: Thumbnails from the API use `~/getmedia/...` format (main site relative). Use `makeImageFromPagethumbnail()` from `dataTransform.ts` to convert to absolute URLs with retina scaling.
- **Activity icons**: SVGs in `/public/images/activities/`. Mapping is in `dataTransform.ts:getActivityIcon()`.
- **Trail status**: Trails with `status === 0` are unpublished and filtered out in `api.ts:getTrails()`.
