import { useEffect, useRef } from 'react'
import type * as mapboxgl from 'mapbox-gl'

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
 */
export function useMapURLSync(map: mapboxgl.Map | null) {
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

      const style = map.getStyle()
      const styleName = style.name || ''
      const base = styleName.toLowerCase().includes('satellite') || styleName.toLowerCase().includes('sat') ? 'photo' : 'map'

      const urlParams = new URLSearchParams(window.location.search)
      urlParams.set('base', base)
      const newURL = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`
      window.history.replaceState(null, '', newURL)
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
  }, [map])
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
