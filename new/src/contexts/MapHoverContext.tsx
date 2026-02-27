import { createContext, useContext, useState, ReactNode } from 'react'
import type { MapboxGeoJSONFeature } from 'mapbox-gl'

export interface HoverInfo {
  lngLat: { lng: number; lat: number } | null
  point: { x: number; y: number } | null
  features: MapboxGeoJSONFeature[]
}

interface MapHoverContextType {
  hoverInfo: HoverInfo | null
  setHoverInfo: (info: HoverInfo | null) => void
}

const MapHoverContext = createContext<MapHoverContextType | undefined>(undefined)

export function MapHoverProvider({ children }: { children: ReactNode }) {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null)

  return (
    <MapHoverContext.Provider value={{ hoverInfo, setHoverInfo }}>
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
