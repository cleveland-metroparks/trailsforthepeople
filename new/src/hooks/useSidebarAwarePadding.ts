import { useMediaQuery } from '@mantine/hooks'
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
export function useSidebarAwarePadding(basePadding: number = 120): { top: number; bottom: number; left: number; right: number } {
  const { isSidebarCollapsed } = useSidebar()
  const isLargeScreen = useMediaQuery('(min-width: 992px)') // Mantine's lg breakpoint

  // Calculate sidebar width: 400px (lg) or 300px (sm) when open, 80px when collapsed
  const sidebarWidth = isSidebarCollapsed
    ? 80
    : (isLargeScreen ? 400 : 300)

  return {
    top: basePadding,
    bottom: basePadding,
    left: sidebarWidth + basePadding, // Add sidebar width plus base padding
    right: basePadding,
  }
}
