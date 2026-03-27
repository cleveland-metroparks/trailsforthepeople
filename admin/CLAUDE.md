# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

React/TypeScript admin dashboard for managing Cleveland Metroparks map content — trails, markers, audit logs, and users. Deployed at `https://maps.clevelandmetroparks.com/admin`.

## Commands

```bash
npm start          # Development server (react-scripts start)
npm run build      # Production build
npm run lint       # ESLint (src/**/*.{ts,tsx})
npm run format     # Prettier write
npm run format:check  # Prettier check (used in CI)
npm test           # Jest via react-scripts
```

## Environment Variables

Copy `.env.example` to `.env.local`. Key variables:

| Variable | Purpose |
|---|---|
| `REACT_APP_MAPBOX_TOKEN` | Mapbox GL access token |
| `REACT_APP_MAPS_API_BASE_URL` | Backend API root (e.g. `https://maps-api.clevelandmetroparks.com`) |
| `REACT_APP_ROOT_PATH` | Deployment path — `/admin` in production |
| `REACT_APP_MAP_DEFAULT_CENTER_LNG/LAT/ZOOM` | Default map center (Cleveland area, zoom 9) |
| `REACT_APP_SKIP_LOGIN` | Set to `true` to bypass auth in development |

## Architecture

### Routing (`src/index.tsx`)

React Router v7 with a protected-route pattern. All authenticated routes are nested under `AuthLayout`, which reads from auth context and redirects unauthenticated users to `/login`. Route loaders (React Router's data loader pattern) prefetch list data before rendering.

```
/login, /logout
/home                 → protected
/trails               → TrailList (loader)
  /:trailId           → TrailEdit
  /:trailId/delete    → TrailDelete
/markers              → MarkerList (loader)
  /:markerId          → MarkerEdit
  /:markerId/delete   → MarkerDelete
/logs, /logs/:logId   → Audit log viewer
/user                 → Account settings
```

### API Client (`src/components/mapsApi.tsx`)

Axios instance with two interceptors:
1. **Request** — reads `XSRF-TOKEN` cookie and injects it as `X-XSRF-TOKEN` header
2. **Response** — on 401, clears the auth context and redirects to `/login`

Base URL is `REACT_APP_MAPS_API_BASE_URL + /api/v1`.

### Auth (`src/hooks/useAuth.tsx`)

Auth state (user object) is stored in localStorage via `useLocalStorage`. The `AuthLayout` component provides the context; `protectedRoute.tsx` gates access.

### Map Editing (`src/components/trailMap.tsx`)

Mapbox GL + react-map-gl with `@mapbox/mapbox-gl-draw` for geometry editing. `draw-control.ts` is a thin wrapper that integrates the draw plugin into react-map-gl's lifecycle. Turf.js is used for geometry calculations (coordinates, distances). GeoJSON is the wire format for trail and marker geometry.

### Forms

Mantine `useForm` for all form state. Trail and marker forms are large single-page editors combining a map panel (geometry), sidebar panels (waypoints, stats, directions, authorship history), and a rich-text description field (TipTap with Mantine wrapper).

### UI Library

**Mantine v8** — use v8 API/docs. Components: core, dates, form, modals, notifications, tiptap. Icons: `@tabler/icons-react`.

### Data Fetching

TanStack Query (React Query) for server state. Route loaders handle initial data; mutations use `useMutation` with query invalidation on success.

## Key Types (`src/types/`)

- `Trail`, `TrailFormData`, `TrailGeometry` — trail editing types
- `Marker`, `MarkerFormData` — event/closure marker types
- `User` — auth user object
