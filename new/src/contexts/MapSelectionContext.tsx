import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface MapSelectionContextType {
  selectionTick: number
  bumpSelectionTick: () => void
}

const MapSelectionContext = createContext<MapSelectionContextType | undefined>(undefined)

export function MapSelectionProvider({ children }: { children: ReactNode }) {
  const [selectionTick, setSelectionTick] = useState(0)

  const bumpSelectionTick = useCallback(() => {
    setSelectionTick((prev) => prev + 1)
  }, [])

  return (
    <MapSelectionContext.Provider value={{ selectionTick, bumpSelectionTick }}>
      {children}
    </MapSelectionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMapSelection() {
  const context = useContext(MapSelectionContext)
  if (context === undefined) {
    throw new Error('useMapSelection must be used within a MapSelectionProvider')
  }
  return context
}
