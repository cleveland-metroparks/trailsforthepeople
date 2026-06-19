# Cleveland Metroparks Maps Content Admin

React + TypeScript admin frontend for managing Cleveland Metroparks maps content (trails, markers, logs, and account tools). The app is deployed under `/admin`.

## Stack

- **React 19** + **TypeScript**
- **Vite 6** (dev server on port `3001`)
- **Mantine v8** (`@mantine/core`, forms, modals, notifications, tiptap)
- **React Router v7** (data loaders/actions)
- **TanStack React Query v5**
- **Axios**
- **Mapbox GL** + **react-map-gl** + **@mapbox/mapbox-gl-draw**

## Prerequisites

- Node and npm versions compatible with `admin/package.json` (Volta pins Node `20.19.6`, npm `11.6.4`)
- A valid Mapbox token
- Access to the maps API environment used for login and data APIs

## Setup

```bash
cd admin
npm install
cp .env.example .env.local
```

Then set required values in `.env.local` (at minimum `VITE_MAPBOX_TOKEN` and API URL values).

## Run

```bash
npm run dev
```

App URL:

- `http://localhost:3001/admin`

Notes:

- Router basename defaults to `VITE_ROOT_PATH` (normally `/admin`).
- Set `VITE_SKIP_LOGIN=true` for local UI development without API auth. Note this
  also disables Axios `withCredentials`, so no session cookie is sent — any
  endpoint that requires authentication will return `401`. Use it only for
  UI/layout work, not against protected endpoints (see below).

## Local development with API authentication

Two ways to run locally against a real (Sanctum-protected) API:

### Option A — Skip auth (UI work only)

Set `VITE_SKIP_LOGIN=true`. A synthetic dev user is injected and login is
bypassed. Because this turns off `withCredentials`, protected endpoints (e.g.
`fulcrum_sync_runs`) return `401`. Fine for layout/UI work against open endpoints.

### Option B — Same-site subdomain over HTTPS (real auth)

Sanctum SPA auth is cookie-based, so the admin and API must be **same-site**.
Serve the admin from a `clevelandmetroparks.com` subdomain that resolves to your
machine, over HTTPS:

1. Map the hostname to localhost:
   ```bash
   echo "127.0.0.1 maps-admin-local.clevelandmetroparks.com" | sudo tee -a /etc/hosts
   ```
2. Generate a locally-trusted cert into `./certs/` (gitignored):
   ```bash
   brew install mkcert nss          # nss only needed for Firefox
   mkcert -install
   mkdir -p certs && cd certs
   mkcert maps-admin-local.clevelandmetroparks.com
   cd ..
   ```
   `vite.config.ts` auto-enables HTTPS once
   `certs/maps-admin-local.clevelandmetroparks.com.pem` (+ `-key.pem`) exist.
3. In `.env.local`: set `VITE_SKIP_LOGIN=false` and point `VITE_MAPS_API_BASE_URL`
   at the API (e.g. `https://maps-api-dev.clevelandmetroparks.com`).
4. `npm run dev`, then open
   `https://maps-admin-local.clevelandmetroparks.com:3001/admin` and log in.

The **API environment** must also trust this origin:

- `SESSION_DOMAIN=.clevelandmetroparks.com` — so the `XSRF-TOKEN` cookie is
  readable by the admin subdomain. Without it you get **419 CSRF token mismatch**.
- `SANCTUM_STATEFUL_DOMAINS` includes `maps-admin-local.clevelandmetroparks.com:3001`.
- CORS allows that origin with `supports_credentials: true`.

If you can't change the API config, a Vite dev proxy (forward `/api`, `/sanctum`,
`/login`, `/logout` with `cookieDomainRewrite`) is a server-change-free fallback.

## Project Structure

```text
admin/
├── public/                   Static assets and manifest files
├── src/
│   ├── index.tsx             App bootstrap, providers, and router
│   ├── App.tsx               Authenticated app shell + nav layout
│   ├── routes/               Route screens and router loaders/actions
│   ├── components/           Shared components and API client
│   ├── hooks/                Auth, local storage, and data hooks
│   └── types/                Domain TypeScript types
├── vite.config.ts
└── package.json
```

## Scripts

| Command                | Description                              |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Start Vite dev server                    |
| `npm start`            | Alias of `npm run dev`                   |
| `npm run build`        | Type-check + production build to `dist/` |
| `npm run preview`      | Preview production build locally         |
| `npm run type-check`   | Run TypeScript without emit              |
| `npm run lint`         | ESLint on `.ts/.tsx` with zero warnings  |
| `npm run format`       | Prettier write over source files         |
| `npm run format:check` | Prettier check without writing           |

## Environment Variables

Copy from `.env.example` and adjust as needed:

| Variable                      | Required    | Purpose                                                    |
| ----------------------------- | ----------- | ---------------------------------------------------------- |
| `VITE_MAPBOX_TOKEN`           | Yes         | Mapbox access token for map rendering/editing              |
| `VITE_MAPBOX_STYLE_URL`       | Yes         | Map style URL used by admin maps                           |
| `VITE_MAPS_API_BASE_URL`      | Yes         | API host root (used as Axios base URL)                     |
| `VITE_MAPS_API_BASE_PATH`     | Yes         | API path segment for data endpoints (for example `api/v1`) |
| `VITE_ROOT_PATH`              | Recommended | Router basename and auth redirect base (usually `/admin`)  |
| `VITE_MAP_DEFAULT_CENTER_LNG` | Recommended | Default map longitude                                      |
| `VITE_MAP_DEFAULT_CENTER_LAT` | Recommended | Default map latitude                                       |
| `VITE_MAP_DEFAULT_ZOOM`       | Recommended | Default map zoom level                                     |
| `VITE_SKIP_LOGIN`             | Optional    | If `true`, bypasses login for local development            |

Important details:

- `VITE_MAPS_API_BASE_URL` is used as the Axios `baseURL`.
- Data endpoints append `VITE_MAPS_API_BASE_PATH` (for example `api/v1/trails`).
- Auth endpoints are called at root paths (`/sanctum/csrf-cookie`, `/login`, `/logout`).
- Vite environment variables are baked at build time; ensure env is correct before `npm run build`.

## Authentication and API Flow

- Login uses Laravel Sanctum SPA flow:
  1. `GET /sanctum/csrf-cookie`
  2. `POST /login`
  3. Session + XSRF cookie are used for subsequent requests
- Axios request interceptor sends `X-XSRF-TOKEN` from cookies.
- Axios response interceptor handles `401` by clearing local user state and redirecting to `VITE_ROOT_PATH/login`.
- With `VITE_SKIP_LOGIN=true`, auth is bypassed and a local dev user is set in storage.

## Route Map

Key routes are defined in `src/index.tsx`:

| Path                     | Purpose                |
| ------------------------ | ---------------------- |
| `/` / `/home`            | Dashboard home         |
| `/login` / `/logout`     | Authentication         |
| `/trails`                | Trails list            |
| `/trails/:trailId`       | Trail editor           |
| `/markers`               | Marker list            |
| `/markers/:markerId`     | Marker editor          |
| `/logs` / `/logs/:logId` | Audit logs             |
| `/sync` / `/sync/:runId` | Fulcrum sync history   |
| `/user`                  | User/account page      |
| `/loops/*`               | Redirects to `/trails` |

## Architecture Overview

- `src/index.tsx`: app bootstrap, providers, and route tree
- `src/App.tsx`: authenticated shell (`AppShell`) with primary navigation
- `src/components/mapsApi.tsx`: shared Axios client, CSRF header injection, session-expiry handling
- `src/hooks/useAuth.tsx`: auth context + local storage persistence
- `src/components/trailMap.tsx`: Mapbox-based trail editing UI with draw controls

## Testing and Quality Checks

Run before opening a PR:

```bash
npm run lint
npm run type-check
npm run format:check
npm run build
```

Current state:

- There is no `npm test` script in this app today.

## Deployment

Deployment setup for both frontend apps is documented in the repo-level guide:

- [`../DEPLOYMENT.md`](../DEPLOYMENT.md)
