import { Text, Box, Stack, Loader, Alert } from '@mantine/core'
import { PanelList } from '../PanelList'
import { PanelHeader } from '../PanelHeader'
import { BackButton } from '../BackButton'
import { HomeButton } from '../HomeButton'
import { useEffect, useMemo, useRef, useCallback, useState } from 'react'
import { useParksData } from '../../hooks/useParksData'
import { useReservationBoundaries } from '../../hooks/useReservationBoundaries'
import { useSidebarAwarePadding } from '../../hooks/useSidebarAwarePadding'
import { useMap } from '../../contexts/MapContext'
import { useDirections } from '../../contexts/DirectionsContext'
import { zoomToFeature, highlightParkBoundary, clearParkHighlight, fadeOutParkHighlight, getBoundingBoxFromGeometry, clearAttractionMarker } from '../../lib/mapUtils'
import { useURLState } from '../../hooks/useURLState'
import { useSidebar } from '../../contexts/SidebarContext'
import type { Reservation } from '../../types/api'
import { ParkDetailPane } from './details/ParkDetailPane'

interface ParksPanelProps {
  onClose: () => void
  onGoHome?: () => void
}

export function ParksPanel({ onGoHome }: ParksPanelProps) {
  const { isMobile } = useSidebar()
  const { data: parks, isLoading, isError, error } = useParksData()
  const { data: boundaries } = useReservationBoundaries()
  const { params, setParams } = useURLState()
  const { map } = useMap()
  const { closeRequestId } = useDirections()
  const sidebarAwarePadding = useSidebarAwarePadding(120)

  // Track whether we should zoom (only on user click, not URL restoration)
  const shouldZoomRef = useRef(false)
  // Track the park ID we've zoomed to (to avoid duplicate zooms)
  const zoomedParkIdRef = useRef<string | null>(null)
  const lastSelectedParkIdRef = useRef<string | null>(null)
  const [focusParkItemKey, setFocusParkItemKey] = useState<string | null>(null)
  // Track if this is the initial load (to zoom to park from URL on page load)
  const isInitialLoadRef = useRef(true)
  const lastDirectionsCloseRequestIdRef = useRef(closeRequestId)

  // Create a map of park names to boundaries for quick lookup
  const boundariesByParkName = useMemo(() => {
    if (!boundaries) return new Map<string, GeoJSON.Polygon | GeoJSON.MultiPolygon>()

    const boundaryMap = new Map<string, GeoJSON.Polygon | GeoJSON.MultiPolygon>()
    boundaries.forEach((boundary) => {
      try {
        const geometry = JSON.parse(boundary.geom_geojson) as GeoJSON.Polygon | GeoJSON.MultiPolygon
        boundaryMap.set(boundary.res, geometry)
      } catch (e) {
        console.error('Failed to parse geometry for', boundary.res, e)
      }
    })
    return boundaryMap
  }, [boundaries])

  // SINGLE SOURCE OF TRUTH: Derive selectedPark from URL params
  const selectedPark = useMemo(() => {
    if (!parks || params.type !== 'park' || !params.gid) {
      return null
    }
    return parks.find((p) => String(p.record_id) === params.gid) || null
  }, [parks, params.type, params.gid])

  const sortedParks = useMemo(() => {
    if (!parks) return []
    return [...parks].sort((a, b) =>
      String(a?.pagetitle ?? '').localeCompare(String(b?.pagetitle ?? ''))
    )
  }, [parks])

  // Helper to zoom to a park
  const zoomToPark = useCallback((park: Reservation) => {
    if (!map) return
    const parkGeometry = boundariesByParkName.get(park.pagetitle)
    if (parkGeometry) {
      const boundingBox = getBoundingBoxFromGeometry(parkGeometry)
      if (boundingBox) {
        zoomToFeature(map, boundingBox, {
          padding: sidebarAwarePadding,
        })
        highlightParkBoundary(map, parkGeometry)
        fadeOutParkHighlight(map, 1000, 2000)
        return
      }
    }
    // Fall back to bounding box or lat/lng from park data
    if (park.boxw && park.boxs && park.boxe && park.boxn) {
      zoomToFeature(map, {
        w: park.boxw,
        s: park.boxs,
        e: park.boxe,
        n: park.boxn,
      }, {
        padding: sidebarAwarePadding,
      })
    } else if (park.latitude && park.longitude) {
      zoomToFeature(map, {
        lat: park.latitude,
        lng: park.longitude,
      }, {
        padding: sidebarAwarePadding,
      })
    }
  }, [map, boundariesByParkName, sidebarAwarePadding])

  // Handle zoom: on user click OR initial page load with park in URL
  useEffect(() => {
    if (!selectedPark || !map) return

    const parkId = params.gid ?? null
    const alreadyZoomed = parkId === zoomedParkIdRef.current
    const didCloseDirections = closeRequestId > lastDirectionsCloseRequestIdRef.current

    // Zoom if: user clicked (shouldZoomRef) OR initial load with park in URL
    if ((shouldZoomRef.current || isInitialLoadRef.current || didCloseDirections) && (!alreadyZoomed || didCloseDirections)) {
      zoomToPark(selectedPark)
      zoomedParkIdRef.current = parkId
    }

    // Clear flags after processing
    shouldZoomRef.current = false
    isInitialLoadRef.current = false
    lastDirectionsCloseRequestIdRef.current = closeRequestId
  }, [selectedPark, params.gid, map, zoomToPark, closeRequestId])

  // Clear highlight when component unmounts
  useEffect(() => {
    return () => {
      clearParkHighlight(map)
    }
  }, [map])

  // Clear attraction marker when park is selected
  useEffect(() => {
    if (!map) return
    if (selectedPark && params.type === 'park') {
      clearAttractionMarker(map)
    }
  }, [selectedPark, params.type, map])

  // Show detail view if a park is selected
  if (selectedPark) {
    return (
      <ParkDetailPane
        panelTitle="Parks"
        park={selectedPark}
        backButton={
          <BackButton
            autoFocus
            onClick={() => {
              // Reset zoom tracking
              zoomedParkIdRef.current = null
              setFocusParkItemKey(lastSelectedParkIdRef.current)
              // Clear park from URL (this will clear selectedPark via derived state)
              setParams({ type: null, gid: null }, false, true)
            }}
          />
        }
      />
    )
  }

  return (
    <Box p="md" pr="sm" style={{ position: 'relative' }}>
      <PanelHeader title="Parks" />
      <Stack spacing="md">
        {isMobile && onGoHome && <HomeButton onClick={onGoHome} />}
        {isLoading && (
          <Box style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader size="sm" />
          </Box>
        )}

        {isError && (
          <Alert color="red" title="Error loading parks">
            {error?.message || 'Failed to load parks. Please try again later.'}
          </Alert>
        )}

        {!isLoading && !isError && parks && (
          <PanelList
            items={sortedParks}
            keyExtractor={(park) => String(park.record_id)}
            countLabel={{ singular: 'park', plural: 'parks' }}
            emptyMessage="No parks found."
            onClick={(park) => {
              // Mark that we want to zoom (user initiated)
              shouldZoomRef.current = true
              lastSelectedParkIdRef.current = String(park.record_id)
              // Update URL with park selection (pushState for back button)
              // This will update selectedPark via derived state
              setParams(
                {
                  type: 'park',
                  gid: String(park.record_id),
                },
                false,
                true
              )
            }}
            onMouseEnter={(park) => {
              // Highlight park boundary on hover using geometry if available
              const parkGeometry = boundariesByParkName.get(park.pagetitle)
              if (parkGeometry) {
                highlightParkBoundary(map, parkGeometry)
              }
            }}
            onMouseLeave={() => {
              // Clear highlight when mouse leaves
              clearParkHighlight(map)
            }}
            onFocus={(park) => {
              const parkGeometry = boundariesByParkName.get(park.pagetitle)
              if (parkGeometry) {
                highlightParkBoundary(map, parkGeometry)
              }
            }}
            onBlur={() => {
              clearParkHighlight(map)
            }}
            getItemAriaLabel={(park) => `View details for ${park.pagetitle}`}
            focusItemKey={focusParkItemKey}
            onFocusItemApplied={() => setFocusParkItemKey(null)}
            renderItem={(park) => (
              <Text size="sm" weight={500}>
                {park.pagetitle}
              </Text>
            )}
          />
        )}
      </Stack>
    </Box>
  )
}
