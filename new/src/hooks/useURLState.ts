import { useSearchParams } from 'react-router-dom'
import { useCallback, useMemo } from 'react'

/**
 * =============================================================================
 * URL STATE MANAGEMENT - FEATURE SELECTION
 * =============================================================================
 *
 * This app uses TWO separate systems for URL state management:
 *
 * 1. MAP POSITION (useMapURLSync hook)
 *    - Params: lat, lng, zoom, base
 *    - Updates continuously as user pans/zooms
 *    - Uses window.history.replaceState (no history entries)
 *    - Why: Map movements happen many times per second - can't use React Router
 *      (too slow, would flood browser history)
 *
 * 2. FEATURE SELECTION (this hook - useURLState)
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

export interface URLStateParams {
  // Feature selection
  type?: string | null // 'attraction', 'park', 'trail', 'activity'
  gid?: string | null // Feature ID (gis_id, record_id, etc.)

  // Activity-specific
  activityId?: string | null // Activity ID for filtering attractions

  // Search-specific
  fromSearch?: string | null // 'true' when feature was selected from search (prevents tab switching)
}

/**
 * Hook to manage URL search parameters
 *
 * @returns Object with current params and functions to update them
 */
export function useURLState() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Get all current params as an object
  // Note: Map position params (lat, lng, zoom, base) are handled by useMapURLSync hook
  const params = useMemo<URLStateParams>(() => {
    return {
      type: searchParams.get('type'),
      gid: searchParams.get('gid'),
      activityId: searchParams.get('activityId'),
      fromSearch: searchParams.get('fromSearch'),
    }
  }, [searchParams])

  /**
   * Set/update URL parameters
   *
   * @param newParams - Object with parameters to set (null/undefined to remove)
   * @param reset - If true, clears all existing params first (default: false)
   * @param pushState - If true, adds to history stack (back button works). If false, replaces current entry.
   */
  const setParams = useCallback(
    (newParams: Partial<URLStateParams>, reset: boolean = false, pushState: boolean = false) => {
      setSearchParams((prev) => {
        const params = reset ? new URLSearchParams() : new URLSearchParams(prev)

        // Set each parameter
        Object.entries(newParams).forEach(([key, value]) => {
          if (value === null || value === undefined || value === '') {
            params.delete(key)
          } else {
            params.set(key, String(value))
          }
        })

        return params
      }, { replace: !pushState })
    },
    [setSearchParams]
  )

  /**
   * Get a specific parameter value
   */
  const getParam = useCallback(
    (key: keyof URLStateParams): string | null => {
      return searchParams.get(key)
    },
    [searchParams]
  )

  /**
   * Clear all parameters
   */
  const clearParams = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  return {
    params,
    setParams,
    getParam,
    clearParams,
  }
}
