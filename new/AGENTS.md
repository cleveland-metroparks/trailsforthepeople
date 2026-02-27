# AGENTS.md

Guidance for Codex and other coding agents working in this repository.

## Purpose

This project is a React + TypeScript rewrite of the Cleveland Metroparks public map app.  
The primary risks are URL-state regressions, map interaction regressions, and sidebar/panel state loops.

## Fast Context Load

Read these files first, in this order:

1. `README.md`
2. `CLAUDE.md`
3. `ARCHITECTURE.md`
4. `src/components/Layout.tsx`
5. `src/components/Sidebar.tsx`
6. `src/components/MapView.tsx`
7. `src/hooks/useURLState.ts`
8. `src/hooks/useMapURLSync.ts`
9. `src/lib/api.ts`
10. `src/lib/mapUtils.ts`

## Environment And Commands

- Node and npm are pinned with Volta in `package.json`.
- Dev server: `npm run dev` (port `3001`)
- Lint: `npm run lint`
- Type check: `npm run type-check`
- Build: `npm run build`

## Architecture Invariants (Do Not Break)

- Keep the two URL systems separate:
  - Map position (`lat`, `lng`, `zoom`, `base`) is managed by `useMapURLSync` via `window.history.replaceState`.
  - Feature selection (`type`, `gid`, `activityId`, `fromSearch`) is managed by `useURLState` via React Router.
- Preserve feature selection as URL-derived state in panels.
  - Panels should derive selected entity from URL params, not duplicate local selection state.
- Keep map feature interactions restricted to known clickable layers in `MapView.tsx`.
- Always clean up map layers/sources/markers/highlights on unmount or selection changes.
- Keep context hooks inside their providers; current provider nesting in `Layout.tsx` is intentional.
- Keep sidebar panels lazy-loaded in `Sidebar.tsx`.
- Keep API transforms centralized:
  - Fetch in `src/lib/api.ts`
  - Normalize in `src/lib/dataTransform.ts`
  - Define types in `src/types/api.ts`

## Change Patterns

For a new API-backed feature:

1. Add/extend type(s) in `src/types/api.ts`.
2. Add endpoint call in `src/lib/api.ts`.
3. Add transform logic in `src/lib/dataTransform.ts` if needed.
4. Add a React Query hook in `src/hooks/`.
5. Consume via panel/component with URL-derived state where appropriate.

For a new sidebar panel:

1. Create panel in `src/components/panels/`.
2. Lazy-load it in `src/components/Sidebar.tsx`.
3. Add tab UI entry and panel route block in `Sidebar.tsx`.
4. If panel selects map features, use `useURLState` and `mapUtils` helpers.

For map visuals (highlight/route/marker):

1. Reuse helpers in `src/lib/mapUtils.ts`.
2. Ensure cleanup in `useEffect` return paths.
3. Guard for map/style readiness (`map`, `map.isStyleLoaded()`).

## Guardrails For Safe Edits

- Prefer extending existing patterns over introducing new state frameworks.
- Do not mix direct map URL updates with React Router for feature params.
- Do not hardcode API base URLs outside `api.ts` and `useMapConfig.ts`.
- Avoid adding side effects in render paths; keep them in effects/callbacks.
- Keep UI behavior consistent with current app:
  - Sidebar collapse/expand behavior
  - Back button behavior for feature details
  - Search autocomplete and search-result selection behavior

## Pre-Submit Checklist

Run before handing off:

1. `npm run lint`
2. `npm run type-check`
3. If build-related changes: `npm run build`

Manual sanity checks for map-related changes:

1. Open app and confirm map loads.
2. Select park/trail/attraction and verify URL updates correctly.
3. Pan/zoom map and confirm URL map params update without polluting history.
4. Use browser back button through feature selections.
5. Confirm highlights/markers/routes clear when expected.

## Debugging Notes

- Debug panel can be enabled in browser console with `showDebugPanel()`.
- If selection behavior is odd, inspect:
  - `params` from `useURLState`
  - `selectionTick` from `MapSelectionContext`
  - `openRequestId` / `closeRequestId` from `DirectionsContext`

