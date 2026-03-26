import { useSidebar } from '../contexts/SidebarContext'
import { MOBILE_SHEET_PEEKED_HEIGHT } from '../components/sidebarConstants'

/**
 * Hook to get padding options for explicit zoom operations (zoomToFeature / fitBounds / flyTo).
 *
 * On mobile, zooms to the area visible above the peeked sheet — feature selection always
 * transitions to peeked state (128px), so this keeps the feature clear of the peek strip.
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
    // Zoom to the area above the peeked sheet. Feature selection always goes to peeked state
    // (128px tall). Add 48px of clearance above the peek strip for line rendering, rounding,
    // and iOS viewport variations.
    return { top: 20, bottom: MOBILE_SHEET_PEEKED_HEIGHT + 48, left: 20, right: 20 }
  }

  return {
    top: basePadding,
    bottom: basePadding,
    left: sidebarWidth + basePadding,
    right: basePadding,
  }
}
