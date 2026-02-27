# ARCHITECTURE.md

High-level architecture for the Cleveland Metroparks Maps frontend.

## System Summary

- SPA built with React 18 + TypeScript + Vite.
- Full-screen Mapbox map with a collapsible left sidebar.
- Sidebar hosts lazy-loaded panels for search, parks, activities, trails, directions, share, and credits.
- Data is fetched from `maps-api.clevelandmetroparks.com/api/v1` and cached with React Query.

## Runtime Composition

## Boot Sequence

1. `src/main.tsx` creates `QueryClient`, wraps app with:
   - `QueryClientProvider`
   - `MantineProvider`
   - `BrowserRouter`
2. `src/App.tsx` renders `Layout` and lazy-loads `MapView` on `/`.
3. `src/components/Layout.tsx` mounts context providers and `AppShell`.
4. `src/components/MapView.tsx` initializes Mapbox map and binds map interactions.

## Provider Graph

Provider order in `Layout.tsx`:

1. `MapProvider`
2. `MapSelectionProvider`
3. `MapHoverProvider`
4. `SearchProvider`
5. `DirectionsProvider`
6. `SidebarProvider`

All `useXxx` context hooks throw if used outside their provider.

## Core State Model

## URL State (Two Separate Systems)

The app intentionally splits URL state into two mechanisms.

- Map position (`lat`, `lng`, `zoom`, `base`)
  - Hook: `useMapURLSync`
  - Write path: `window.history.replaceState`
  - Behavior: high-frequency updates while moving map, no history stack pollution
- Feature selection (`type`, `gid`, `activityId`, `fromSearch`)
  - Hook: `useURLState`
  - Write path: React Router `setSearchParams`
  - Behavior: discrete pushes for back-button navigation

Do not merge these systems; this split is required for performance and correct history behavior.

## Sidebar And Panel State

- `Sidebar.tsx` controls active panel/tab and nav expansion.
- Panel content is mounted only when a tab is active.
- Tab switches and close actions clear feature params (`type`, `gid`, `activityId`, `fromSearch`) but preserve map params.
- Directions panel transitions are request-counter based (`openRequestId` / `closeRequestId`) via `DirectionsContext`.

## Data And API Layer

## API Client

- `src/lib/api.ts` defines a shared axios client.
- Base URL uses:
  - `VITE_MAPS_API_BASE_URL` (default `https://maps-api.clevelandmetroparks.com`)
  - `VITE_MAPS_API_BASE_PATH` (default `api/v1`)

Main endpoints:

- `reservations` (parks)
- `attractions`
- `activities`
- `trails` (unpublished trails filtered in client where `status === 0`)
- `categories`
- `reservation_boundaries`
- `trail_geometries/{id}`
- `geocode/{address}`
- `directions_driving`, `directions_transit`, `directions_trails`

## React Query Hooks

Data hooks in `src/hooks/` wrap API calls with query keys and `staleTime` of 5 minutes:

- `useParksData`
- `useActivitiesData`
- `useTrailsData`
- `useCategoriesData`
- `useReservationBoundaries`

## Data Transformation

`src/lib/dataTransform.ts` normalizes API shapes:

- pipe-delimited attraction fields (`categories`, `activities`) -> numeric arrays
- trail boolean-like strings -> real booleans
- activity ID -> icon path mapping
- thumbnail URL normalization helper (`makeImageFromPagethumbnail`)

## Search Architecture

## Indexing

- `useSearchIndex` builds a FlexSearch `Document` index over:
  - attractions
  - reservations (parks)
  - trails
- Search document stores title + location + gid metadata.

## Search Context

`SearchContext` manages:

- `searchTerm`
- `searchResults`
- `autocompleteSuggestions` (debounced)
- loading/error state
- coordinate-search pass-through (`coordinates`)

Search flow:

1. Try coordinate parsing.
2. Run local FlexSearch query.
3. If no matches, fallback to geocode API.

UI entry points:

- `FloatingSearch` overlays map when sidebar is collapsed.
- `SearchPanel` renders full search and detail transitions.

## Map Interaction Model

## Map Initialization

`MapView.tsx`:

- waits for container readiness
- reads initial map state from URL
- creates map with configured style/token
- adds reset, navigation, and geolocate controls
- exposes map instance through `MapContext`

## Click/Hover Logic

- Interactions are limited to hardcoded layer IDs:
  - attraction layers
  - attraction group layers
- Clicking attraction group layer zooms in.
- Clicking valid attraction feature writes URL selection (`type=attraction`, `gid`).

## Map Utility Layer

`src/lib/mapUtils.ts` centralizes map operations:

- `zoomToFeature`
- park boundary highlight and fade
- trail geometry highlight
- attraction marker placement
- directions route draw/clear + bounds fit

Most map race-condition and style-load safety logic belongs here, not duplicated in panels.

## Panel Detail Pattern

Each major panel follows the same pattern:

1. Derive selected entity from URL params (single source of truth).
2. Render either list view or detail view.
3. On click, set URL params (`pushState`) and optionally zoom/highlight.
4. On back, clear URL selection and cleanup map overlays.

Shared detail layout/components are in:

- `src/components/panels/details/FeatureDetailLayout.tsx`
- `src/components/panels/details/DetailSections.tsx`

## Directions Flow

- Initiated from detail sections or directions panel.
- `DirectionsPanel` resolves text to coordinates using:
  - explicit coordinates
  - search suggestions
  - geocode fallback
- Calls API via `getDirections` with mode routing:
  - `car` -> `directions_driving`
  - `bus` -> `directions_transit`
  - `hike`/`bike` -> `directions_trails?via=...`
- Converts WKT to GeoJSON and draws route/markers on map.

## Build And Performance

- Vite manual chunking in `vite.config.ts`:
  - `mapbox-gl`
  - `react-vendor` (React + Mantine + Emotion kept together)
  - `turf-vendor`
  - `vendor`
- Sidebar panels are lazy-loaded.
- `MapView` is lazy-loaded from `App.tsx`.

## Directory Roles

- `src/components/` UI, map surface, sidebar/panels
- `src/contexts/` app-level shared state
- `src/hooks/` data hooks and integration hooks
- `src/lib/` API + pure helpers + map helpers
- `src/types/` API and domain TypeScript contracts
- `public/` static assets (icons, images, manifest)

## Extension Guidelines

For new API data:

1. Add types in `src/types/api.ts`.
2. Add endpoint in `src/lib/api.ts`.
3. Add transforms in `src/lib/dataTransform.ts` when required.
4. Add React Query hook in `src/hooks/`.

For new panel capabilities:

1. Keep URL-driven selection.
2. Use `mapUtils` for map overlays/zoom.
3. Ensure cleanup in `useEffect` returns.
4. Lazy-load in `Sidebar.tsx`.

