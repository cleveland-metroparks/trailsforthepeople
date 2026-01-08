import { Text, Box, Stack, Loader, Alert, Button, Anchor, Divider } from '@mantine/core'
import { useState, useEffect, useMemo } from 'react'
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

  // Initialize selected park from URL if present
  const [selectedPark, setSelectedPark] = useState<Reservation | null>(null)

  // Create a map of park names to boundaries for quick lookup
  const boundariesByParkName = useMemo(() => {
    if (!boundaries) return new Map<string, GeoJSON.Polygon | GeoJSON.MultiPolygon>()

    const map = new Map<string, GeoJSON.Polygon | GeoJSON.MultiPolygon>()
    boundaries.forEach((boundary) => {
      try {
        const geometry = JSON.parse(boundary.geom_geojson) as GeoJSON.Polygon | GeoJSON.MultiPolygon
        map.set(boundary.res, geometry)
      } catch (e) {
        console.error('Failed to parse geometry for', boundary.res, e)
      }
    })
    return map
  }, [boundaries])
  
  // Load park from URL on mount or when params change
  useEffect(() => {
    if (!parks || !params.type || params.type !== 'park' || !params.gid) {
      if (params.type !== 'park') {
        setSelectedPark(null)
      }
      return
    }

    const parkId = params.gid
    const park = parks.find((p) => String(p.record_id) === parkId)
    if (park && park !== selectedPark) {
      setSelectedPark(park)
      // Zoom to park when loaded from URL
      const parkGeometry = boundariesByParkName.get(park.pagetitle)
      if (parkGeometry) {
        const boundingBox = getBoundingBoxFromGeometry(parkGeometry)
        if (boundingBox) {
          zoomToFeature(map, boundingBox, {
            padding: sidebarAwarePadding,
          })
          highlightParkBoundary(map, parkGeometry)
          fadeOutParkHighlight(map, 1000, 2000)
        }
      }
    }
  }, [params.type, params.gid, parks, boundariesByParkName, map, sidebarAwarePadding, selectedPark])

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
              setSelectedPark(null)
              // Clear park from URL
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
                        setSelectedPark(park)
                        // Update URL with park selection (pushState for back button)
                        setParams(
                          {
                            type: 'park',
                            gid: String(park.record_id),
                          },
                          false,
                          true
                        )
                        // Highlight park boundary if geometry is available
                        if (parkGeometry) {
                          highlightParkBoundary(map, parkGeometry)
                          // Fade out highlight after 3 seconds
                          fadeOutParkHighlight(map, 1000, 2000)
                        }
                        // Zoom to park on map using its boundary geometry
                        if (parkGeometry) {
                          const boundingBox = getBoundingBoxFromGeometry(parkGeometry)
                          if (boundingBox) {
                            zoomToFeature(map, boundingBox, {
                              padding: sidebarAwarePadding,
                            })
                          } else if (park.latitude && park.longitude) {
                            // Fall back to lat/lng if bounding box calculation fails
                            zoomToFeature(map, {
                              lat: park.latitude,
                              lng: park.longitude,
                            }, {
                              padding: sidebarAwarePadding,
                            })
                          }
                        } else if (park.boxw && park.boxs && park.boxe && park.boxn) {
                          // Use bounding box from park data if geometry not available
                          zoomToFeature(map, {
                            w: park.boxw,
                            s: park.boxs,
                            e: park.boxe,
                            n: park.boxn,
                          }, {
                            padding: sidebarAwarePadding,
                          })
                        } else if (park.latitude && park.longitude) {
                          // Fall back to lat/lng
                          zoomToFeature(map, {
                            lat: park.latitude,
                            lng: park.longitude,
                          }, {
                            padding: sidebarAwarePadding,
                          })
                        }
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
