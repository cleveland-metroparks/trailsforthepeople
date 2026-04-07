import { useEffect, useRef } from 'react'
import type * as mapboxgl from 'mapbox-gl'

export type MapBasemapParam = 'map' | 'photo'

export type MapStyleLayerUrls = { map: string; photo: string }

/** Extract Mapbox hosted style id from a mapbox:// URL (e.g. `mapbox://styles/user/abc123` → `abc123`). */
function mapboxStyleIdFromUrl(styleUrl: string): string | null {
  const m = styleUrl.trim().match(/mapbox:\/\/styles\/[^/]+\/([^/?#]+)/i)
  return m ? m[1] : null
}

function inferBasemapFromLoadedStyle(
  map: mapboxgl.Map,
  styleLayers?: MapStyleLayerUrls
): MapBasemapParam {
  const spec = map.getStyle()
  if (!spec) return 'map'

  const rawId = (spec as { id?: unknown }).id
  const specId = typeof rawId === 'string' ? rawId : null
  const specJson = JSON.stringify(spec)

  if (styleLayers) {
    const photoId = mapboxStyleIdFromUrl(styleLayers.photo)
    const mapId = mapboxStyleIdFromUrl(styleLayers.map)
    // Root `id` often matches the Mapbox style id, but many Studio styles omit it in `getStyle()`.
    // The serialized spec still references the style id in sprite/glyph URLs and similar fields.
    if (photoId && ((specId && specId === photoId) || specJson.includes(photoId))) {
      return 'photo'
    }
    if (mapId && ((specId && specId === mapId) || specJson.includes(mapId))) {
      return 'map'
    }
  }

  const styleName = (spec.name || '').toLowerCase()
  if (styleName.includes('photo')) return 'photo'
  return 'map'
}

/**
 * Update only the map basemap (`base`) query param via replaceState, preserving other params.
 */
export function replaceMapBasemapInURL(base: MapBasemapParam): void {
  const urlParams = new URLSearchParams(window.location.search)
  urlParams.set('base', base)
  const newURL = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`
  window.history.replaceState(null, '', newURL)
}

/**
 * =============================================================================
 * URL STATE MANAGEMENT - MAP POSITION
 * =============================================================================
 *
 * This app uses TWO separate systems for URL state management:
 *
 * 1. MAP POSITION (this hook - useMapURLSync)
 *    - Params: lat, lng, zoom, base
 *    - Updates continuously as user pans/zooms
 *    - Uses window.history.replaceState (no history entries)
 *    - Why: Map movements happen many times per second - can't use React Router
 *      (too slow, would flood browser history)
 *
 * 2. FEATURE SELECTION (useURLState hook)
 *    - Params: type, gid, activityId
 *    - Updates when user clicks a park, trail, or attraction
 *    - Uses React Router with pushState (creates history entries)
 *    - Why: These are discrete user actions that should support back button
 *
 * RESULT:
 *    - Copy/paste URL = exact same view (position + selection)
 *    - Back button = returns to previous feature selection
 *    - No history pollution from panning around the map
 *
 * =============================================================================
 */

/**
 * Hook to sync map position (lat, lng, zoom, base) to URL
 *
 * Uses direct window.history.replaceState for fast, reliable URL updates.
 *
 * @param map - The mapbox map instance (can be null)
 * @param styleLayers - When set, `base` is synced from loaded style using Mapbox style ids from these URLs (falls back to name heuristic)
 */
export function useMapURLSync(map: mapboxgl.Map | null, styleLayers?: MapStyleLayerUrls) {
  const isInitialLoadRef = useRef(true)
  const initialLoadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastUpdateTimeRef = useRef(0)

  useEffect(() => {
    if (!map) {
      return
    }

    const THROTTLE_MS = 100 // Update at most every 100ms during movement

    /**
     * Update URL with current map position
     * Uses direct window.history.replaceState for immediate updates
     */
    const updateURL = () => {
      if (!map || isInitialLoadRef.current) return

      const center = map.getCenter()
      const zoom = map.getZoom()

      // Get current URL params
      const urlParams = new URLSearchParams(window.location.search)

      // Update map position params
      urlParams.set('lat', center.lat.toFixed(7))
      urlParams.set('lng', center.lng.toFixed(7))
      urlParams.set('zoom', zoom.toFixed(1))

      // Build new URL
      const newURL = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`

      // Update URL using replaceState (doesn't add to history)
      window.history.replaceState(null, '', newURL)
      lastUpdateTimeRef.current = Date.now()
    }

    /**
     * Throttled update - only updates if enough time has passed
     */
    const updateURLThrottled = () => {
      if (!map || isInitialLoadRef.current) return

      const now = Date.now()
      if (now - lastUpdateTimeRef.current >= THROTTLE_MS) {
        updateURL()
      }
    }

    /**
     * Update basemap param when style changes
     */
    const updateBasemapURL = () => {
      if (!map || isInitialLoadRef.current) return

      const inferred = inferBasemapFromLoadedStyle(map, styleLayers)
      const urlBase = new URLSearchParams(window.location.search).get('base')
      // Navigation / toggle sets `base=photo` before `style.load`; if inference still says vector,
      // do not clobber the URL (Studio style names often omit "photo" and root `id` is unset).
      if (inferred === 'map' && urlBase === 'photo') {
        return
      }

      replaceMapBasemapInURL(inferred)
    }

    // Wait a moment after map loads to avoid updating during initial positioning
    initialLoadTimerRef.current = setTimeout(() => {
      isInitialLoadRef.current = false
    }, 1000) // Wait 1 second after map loads

    // Attach event listeners
    // 'move' fires during both pan and zoom, so we only need move/moveend
    map.on('move', updateURLThrottled)
    map.on('moveend', updateURL) // Always update on end to capture final state
    map.on('style.load', updateBasemapURL)

    return () => {
      // Clear initial load timer
      if (initialLoadTimerRef.current) {
        clearTimeout(initialLoadTimerRef.current)
        initialLoadTimerRef.current = null
      }
      // Remove event listeners
      if (map) {
        map.off('move', updateURLThrottled)
        map.off('moveend', updateURL)
        map.off('style.load', updateBasemapURL)
      }
      // Reset initial load flag for next mount
      isInitialLoadRef.current = true
    }
  }, [map, styleLayers])
}

/**
 * Get initial map position from URL params
 *
 * @returns Object with lat, lng, zoom, base from URL or null
 */
export function getInitialMapStateFromURL(): {
  lat: number | null
  lng: number | null
  zoom: number | null
  base: string | null
} {
  const urlParams = new URLSearchParams(window.location.search)

  const lat = urlParams.get('lat')
  const lng = urlParams.get('lng')
  const zoom = urlParams.get('zoom')
  const base = urlParams.get('base')

  return {
    lat: lat ? parseFloat(lat) : null,
    lng: lng ? parseFloat(lng) : null,
    zoom: zoom ? parseFloat(zoom) : null,
    base: base || null,
  }
}
