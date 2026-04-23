import { createContext, useContext, ReactNode, useState, useCallback, useMemo } from 'react'
import type * as mapboxgl from 'mapbox-gl'

interface MapContextType {
  map: mapboxgl.Map | null
  setMap: (map: mapboxgl.Map | null) => void
  styleEpoch: number
  bumpStyleEpoch: () => void
}

const MapContext = createContext<MapContextType | undefined>(undefined)

interface MapProviderProps {
  children: ReactNode
}

export function MapProvider({ children }: MapProviderProps) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [styleEpoch, setStyleEpoch] = useState(0)
  const bumpStyleEpoch = useCallback(() => {
    setStyleEpoch((e) => e + 1)
  }, [])

  const value = useMemo(
    () => ({ map, setMap, styleEpoch, bumpStyleEpoch }),
    [map, styleEpoch, bumpStyleEpoch]
  )

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMap() {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider')
  }
  return context
}
