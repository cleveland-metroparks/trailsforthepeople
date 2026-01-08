import { createContext, useContext, ReactNode, useState } from 'react'
import mapboxgl from 'mapbox-gl'

interface MapContextType {
  map: mapboxgl.Map | null
  setMap: (map: mapboxgl.Map | null) => void
}

const MapContext = createContext<MapContextType | undefined>(undefined)

interface MapProviderProps {
  children: ReactNode
}

export function MapProvider({ children }: MapProviderProps) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  return <MapContext.Provider value={{ map, setMap }}>{children}</MapContext.Provider>
}

export function useMap() {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider')
  }
  return context
}
