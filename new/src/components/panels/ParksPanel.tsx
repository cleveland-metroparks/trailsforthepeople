import { Text, Box, Stack, Loader, Alert, Button, Anchor, Divider } from '@mantine/core'
import { useEffect, useMemo, useRef, useCallback } from 'react'
import { useParksData } from '../../hooks/useParksData'
import { useReservationBoundaries } from '../../hooks/useReservationBoundaries'
import { useSidebarAwarePadding } from '../../hooks/useSidebarAwarePadding'
import { makeImageFromPagethumbnail } from '../../lib/dataTransform'
import { useMap } from '../../contexts/MapContext'
import { zoomToFeature, highlightParkBoundary, clearParkHighlight, fadeOutParkHighlight, getBoundingBoxFromGeometry } from '../../lib/mapUtils'
import { useURLState } from '../../hooks/useURLState'
import type { Reservation } from '../../types/api'

interface ParksPanelProps {
  onClose: () => void
}

export function ParksPanel({ onClose }: ParksPanelProps) {
  const { data: parks, isLoading, isError, error } = useParksData()
  const { data: boundaries, isLoading: boundariesLoading } = useReservationBoundaries()
  const { params, setParams } = useURLState()
  const { map } = useMap()
  const sidebarAwarePadding = useSidebarAwarePadding(120)

  // Track whether we should zoom (only on user click, not URL restoration)
  const shouldZoomRef = useRef(false)
  // Track the park ID we've zoomed to (to avoid duplicate zooms)
  const zoomedParkIdRef = useRef<string | null>(null)
  // Track if this is the initial load (to zoom to park from URL on page load)
  const isInitialLoadRef = useRef(true)

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

    // Zoom if: user clicked (shouldZoomRef) OR initial load with park in URL
    if ((shouldZoomRef.current || isInitialLoadRef.current) && !alreadyZoomed) {
      zoomToPark(selectedPark)
      zoomedParkIdRef.current = parkId
    }

    // Clear flags after processing
    shouldZoomRef.current = false
    isInitialLoadRef.current = false
  }, [selectedPark, params.gid, map, zoomToPark])

  // Clear highlight when component unmounts
  useEffect(() => {
    return () => {
      clearParkHighlight(map)
    }
  }, [map])

  // Show detail view if a park is selected
  if (selectedPark) {
    const pagethumbnail = (selectedPark as Record<string, unknown>).pagethumbnail as string | undefined
    const imgProps = makeImageFromPagethumbnail(pagethumbnail, 320)
    const descr = (selectedPark as Record<string, unknown>).descr as string | undefined
    const hoursofoperation = (selectedPark as Record<string, unknown>).hoursofoperation as string | undefined
    const phone = (selectedPark as Record<string, unknown>).phone as string | undefined

    return (
      <Box p="md" style={{ position: 'relative' }}>
        <Stack spacing="md">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => {
              // Reset zoom tracking
              zoomedParkIdRef.current = null
              // Clear park from URL (this will clear selectedPark via derived state)
              setParams({ type: null, gid: null }, false, true)
            }}
            style={{ alignSelf: 'flex-start' }}
          >
            ← Parks
          </Button>

          <Text size="lg" weight={500}>
            {selectedPark.pagetitle}
          </Text>

          {imgProps && (
            <Box>
              <img
                src={imgProps.src}
                width={imgProps.width}
                height={imgProps.height}
                alt={selectedPark.pagetitle}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </Box>
          )}

          {descr && (
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {descr}
            </Text>
          )}

          {hoursofoperation && (
            <>
              <Divider />
              <Box>
                <Text size="sm" weight={500} mb="xs">
                  Hours of Operation
                </Text>
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {hoursofoperation}
                </Text>
              </Box>
            </>
          )}

          {phone && (
            <>
              <Divider />
              <Box>
                <Text size="sm" weight={500} mb="xs">
                  Phone
                </Text>
                <Anchor href={`tel:${phone}`} size="sm">
                  {phone}
                </Anchor>
              </Box>
            </>
          )}
        </Stack>
      </Box>
    )
  }

  return (
    <Box p="md" style={{ position: 'relative' }}>
      <Stack spacing="md">
        <Text size="lg" weight={500}>
          Parks
        </Text>

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
          <>
            {parks.length === 0 ? (
              <Text size="sm" color="dimmed">
                No parks found.
              </Text>
            ) : (
              <Stack spacing={0}>
                <Text size="sm" weight={500} color="dimmed">
                  {parks.length} {parks.length === 1 ? 'park' : 'parks'}
                </Text>
                {parks.map((park, index) => {
                  const parkGeometry = boundariesByParkName.get(park.pagetitle)

                  return (
                    <Box
                      key={park.record_id}
                      p="sm"
                      style={{
                        border: '1px solid #e0e0e0',
                        borderTop: index === 0 ? '1px solid #e0e0e0' : 'none',
                        borderRadius: index === 0 ? '4px 4px 0 0' : index === parks.length - 1 ? '0 0 4px 4px' : '0',
                        cursor: 'pointer',
                      }}
                      sx={{
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                        },
                      }}
                      onMouseEnter={() => {
                        // Highlight park boundary on hover using geometry if available
                        if (parkGeometry) {
                          highlightParkBoundary(map, parkGeometry)
                        }
                      }}
                      onMouseLeave={() => {
                        // Clear highlight when mouse leaves
                        clearParkHighlight(map)
                      }}
                      onClick={() => {
                        // Mark that we want to zoom (user initiated)
                        shouldZoomRef.current = true
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
                    >
                      <Text size="sm" weight={500}>
                        {park.pagetitle}
                      </Text>
                    </Box>
                  )
                })}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Box>
  )
}
