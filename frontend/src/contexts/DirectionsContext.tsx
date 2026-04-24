import { createContext, useContext, ReactNode, useState, useCallback, useRef } from 'react'

export type ViaMode = 'hike' | 'bike' | 'car' | 'bus'

export interface DirectionsTarget {
  name: string
  lat: number
  lng: number
  reservationId?: string | number
}

export interface DirectionsEndpoints {
  from: { lat: number; lng: number }
  to: { lat: number; lng: number }
}

interface DirectionsContextType {
  target: DirectionsTarget | null
  via: ViaMode
  /** Increments each time openDirections is called; Sidebar watches this to switch tabs */
  openRequestId: number
  /** Increments each time closeDirections is called; Sidebar watches this to switch back */
  closeRequestId: number
  isDirectionsLoading: boolean
  setDirectionsLoading: (loading: boolean) => void
  /** Set once from/to coords are resolved; cleared when loading ends */
  directionsEndpoints: DirectionsEndpoints | null
  setDirectionsEndpoints: (endpoints: DirectionsEndpoints | null) => void
  openDirections: (target: DirectionsTarget, via: ViaMode) => void
  setVia: (via: ViaMode) => void
  closeDirections: () => void
}

const DirectionsContext = createContext<DirectionsContextType | undefined>(undefined)

export function DirectionsProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<DirectionsTarget | null>(null)
  const [via, setVia] = useState<ViaMode>('hike')
  const [openRequestId, setOpenRequestId] = useState(0)
  const [closeRequestId, setCloseRequestId] = useState(0)
  const [isDirectionsLoading, setDirectionsLoading] = useState(false)
  const [directionsEndpoints, setDirectionsEndpoints] = useState<DirectionsEndpoints | null>(null)
  const openRequestIdRef = useRef(0)
  const closeRequestIdRef = useRef(0)

  const openDirections = useCallback((newTarget: DirectionsTarget, newVia: ViaMode) => {
    setTarget(newTarget)
    setVia(newVia)
    openRequestIdRef.current += 1
    setOpenRequestId(openRequestIdRef.current)
  }, [])

  const closeDirections = useCallback(() => {
    setTarget(null)
    closeRequestIdRef.current += 1
    setCloseRequestId(closeRequestIdRef.current)
  }, [])

  return (
    <DirectionsContext.Provider
      value={{
        target,
        via,
        openRequestId,
        closeRequestId,
        isDirectionsLoading,
        setDirectionsLoading,
        directionsEndpoints,
        setDirectionsEndpoints,
        openDirections,
        setVia,
        closeDirections,
      }}
    >
      {children}
    </DirectionsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDirections() {
  const context = useContext(DirectionsContext)
  if (context === undefined) {
    throw new Error('useDirections must be used within a DirectionsProvider')
  }
  return context
}
