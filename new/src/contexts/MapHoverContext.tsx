import { createContext, useContext, useMemo, useState, ReactNode } from 'react'
import type { MapboxGeoJSONFeature } from 'mapbox-gl'

export interface HoverInfo {
  lngLat: { lng: number; lat: number } | null
  point: { x: number; y: number } | null
  features: MapboxGeoJSONFeature[]
  /** All features under cursor (unfiltered), for debug panel "show all layers" */
  allFeatures?: MapboxGeoJSONFeature[]
}

interface MapHoverContextType {
  hoverInfo: HoverInfo | null
  setHoverInfo: (info: HoverInfo | null) => void
}

const MapHoverContext = createContext<MapHoverContextType | undefined>(undefined)

export function MapHoverProvider({ children }: { children: ReactNode }) {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null)

  // Memoize the context value so consumers only re-render when hoverInfo
  // actually changes (setHoverInfo is a stable setState setter).
  const value = useMemo(() => ({ hoverInfo, setHoverInfo }), [hoverInfo])

  return (
    <MapHoverContext.Provider value={value}>
      {children}
    </MapHoverContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMapHover() {
  const context = useContext(MapHoverContext)
  if (context === undefined) {
    throw new Error('useMapHover must be used within a MapHoverProvider')
  }
  return context
}
