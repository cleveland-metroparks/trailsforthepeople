/**
 * Feature flags derived from Vite environment variables.
 * All flags default to false (off) unless explicitly set to 'true'.
 *
 * To enable flags locally, add them to .env.local:
 *   VITE_ENABLE_TRANSIT_DIRECTIONS=true
 *   VITE_ENABLE_TRAIL_ENDPOINT_MARKERS=true
 */
export const featureFlags = {
  /** Show the Transit (bus) option in the directions via-mode selector. */
  transitDirections: import.meta.env.VITE_ENABLE_TRANSIT_DIRECTIONS === 'true',
  /** Draw start/end circle markers at trail endpoints when a trail is selected. */
  trailEndpointMarkers: import.meta.env.VITE_ENABLE_TRAIL_ENDPOINT_MARKERS === 'true',
  /** Highlight park boundary on map when hovering/focusing a park in the parks list. */
  parkListHoverHighlight: import.meta.env.VITE_ENABLE_PARK_LIST_HOVER_HIGHLIGHT === 'true',
} as const
