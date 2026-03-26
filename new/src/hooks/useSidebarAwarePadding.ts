import { useSidebar } from '../contexts/SidebarContext'
import { MOBILE_BOTTOM_BAR_HEIGHT } from '../components/sidebarConstants'

/**
 * Hook to get padding options for explicit zoom operations (zoomToFeature / fitBounds / flyTo).
 *
 * On mobile, always zooms as if the sheet is collapsed — treating the map area as full screen
 * minus the 76px bottom bar. The expanded sheet may cover part of the result, but the zoom
 * level is meaningful and the user can collapse the sheet to see the feature clearly.
 *
 * On desktop, adds the sidebar width to the left so features zoom into the visible area
 * to the right of the panel.
 *
 * @param basePadding - Visual margin added on all sides for desktop (default: 120)
 *
 * @example
 * ```tsx
 * const padding = useSidebarAwarePadding(120)
 * zoomToFeature(map, feature, { padding })
 * ```
 */
export function useSidebarAwarePadding(basePadding = 120): { top: number; bottom: number; left: number; right: number } {
  const { sidebarWidth, isMobile } = useSidebar()

  if (isMobile) {
    // Always zoom to the area visible when the sheet is collapsed (full screen minus bottom bar).
    // We intentionally ignore isSheetExpanded — the expanded sheet may cover part of the map,
    // but the zoom level stays meaningful and the user can collapse the sheet to see the feature.
    return { top: 20, bottom: MOBILE_BOTTOM_BAR_HEIGHT + 20, left: 20, right: 20 }
  }

  return {
    top: basePadding,
    bottom: basePadding,
    left: sidebarWidth + basePadding,
    right: basePadding,
  }
}
