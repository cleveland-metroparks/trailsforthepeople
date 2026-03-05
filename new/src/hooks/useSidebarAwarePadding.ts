import { useSidebar } from '../contexts/SidebarContext'

/**
 * Hook to get padding options for zoomToFeature that accounts for the sidebar width
 * 
 * @param basePadding - Base padding value in pixels (default: 120)
 * @returns Padding object with left side accounting for sidebar width
 * 
 * @example
 * ```tsx
 * const padding = useSidebarAwarePadding(120)
 * zoomToFeature(map, feature, { padding })
 * ```
 */
export function useSidebarAwarePadding(basePadding = 120): { top: number; bottom: number; left: number; right: number } {
  const { sidebarWidth } = useSidebar()

  return {
    top: basePadding,
    bottom: basePadding,
    left: sidebarWidth + basePadding, // Add sidebar width plus base padding
    right: basePadding,
  }
}
