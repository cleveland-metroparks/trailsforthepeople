import { Text, Box, Stack, Loader, Alert, Select, Button, Divider, Badge, Group } from '@mantine/core'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useTrailsData } from '../../hooks/useTrailsData'
import { useParksData } from '../../hooks/useParksData'
import { useSidebarAwarePadding } from '../../hooks/useSidebarAwarePadding'
import { useMap } from '../../contexts/MapContext'
import { zoomToFeature, highlightTrailLine, clearTrailHighlight } from '../../lib/mapUtils'
import { getTrailGeometry } from '../../lib/api'
import { useURLState } from '../../hooks/useURLState'
import type { TransformedTrail } from '../../types/api'

// Abbreviate distance units for compact display
function abbreviateDistance(text: string): string {
  return text.replace(/Miles?/gi, 'mi').replace(/Feet/gi, 'ft')
}

interface TrailsPanelProps {
  onClose: () => void
}

export function TrailsPanel({ onClose: _onClose }: TrailsPanelProps) {
  const { data: trails, isLoading: trailsLoading, isError: trailsError, error: trailsErrorObj } = useTrailsData()
  const { data: parks, isLoading: parksLoading, isError: parksError, error: parksErrorObj } = useParksData()
  const { params, setParams } = useURLState()
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null)
  const { map } = useMap()
  const sidebarAwarePadding = useSidebarAwarePadding(120)

  // Track whether we should zoom (only on user click, not URL restoration)
  const shouldZoomRef = useRef(false)
  // Track the trail ID we've zoomed to (to avoid duplicate zooms)
  const zoomedTrailIdRef = useRef<string | null>(null)
  // Track if this is the initial load (to zoom to trail from URL on page load)
  const isInitialLoadRef = useRef(true)

  const isLoading = trailsLoading || parksLoading
  const isError = trailsError || parksError
  const error = trailsErrorObj || parksErrorObj

  // SINGLE SOURCE OF TRUTH: Derive selectedTrail from URL params
  const selectedTrail = useMemo(() => {
    if (!trails || params.type !== 'trail' || !params.gid) {
      return null
    }
    return trails.find((t) => String(t.id) === params.gid) || null
  }, [trails, params.type, params.gid])

  // Filter trails by selected reservation
  const filteredTrails = useMemo(() => {
    if (!trails) return []
    if (!selectedReservationId) return trails

    // Filter trails that belong to the selected reservation
    // Note: The old code uses trail['res'] and compares with reservation pagetitle
    // This matches the old implementation where the dropdown value is pagetitle
    return trails.filter((trail) => {
      const trailRes = (trail as { res?: string | number })['res']
      if (trailRes === undefined) return false

      // Compare with selected reservation (which is pagetitle in old code)
      return String(trailRes) === String(selectedReservationId)
    })
  }, [trails, selectedReservationId])

  // Prepare reservation options for dropdown
  // Note: Old code uses pagetitle as the value (see pane_trails_reservation_filter_option.hbs)
  const reservationOptions = useMemo(() => {
    if (!parks) return []
    return [
      { value: '', label: 'All Parks' },
      ...parks.map((park) => ({
        value: park.pagetitle, // Using pagetitle to match old implementation
        label: park.pagetitle,
      })),
    ]
  }, [parks])

  // Track the current trail being fetched to avoid race conditions
  const currentTrailRef = useRef<number | null>(null)

  // Helper to zoom to a trail
  const zoomToTrail = useCallback((trail: TransformedTrail) => {
    if (!map) return
    const trailData = trail as Record<string, unknown>
    if (trailData.boxw && trailData.boxs && trailData.boxe && trailData.boxn) {
      zoomToFeature(map, {
        w: trailData.boxw as number,
        s: trailData.boxs as number,
        e: trailData.boxe as number,
        n: trailData.boxn as number,
      }, {
        padding: sidebarAwarePadding,
      })
    } else {
      const lat = trail.lat as number | undefined
      const lng = trail.lng as number | undefined
      if (lat && lng) {
        zoomToFeature(map, { lat, lng }, { padding: sidebarAwarePadding })
      }
    }
  }, [map, sidebarAwarePadding])

  // Handle zoom: on user click OR initial page load with trail in URL
  useEffect(() => {
    if (!selectedTrail || !map) return

    const trailId = params.gid ?? null
    const alreadyZoomed = trailId === zoomedTrailIdRef.current

    // Zoom if: user clicked (shouldZoomRef) OR initial load with trail in URL
    if ((shouldZoomRef.current || isInitialLoadRef.current) && !alreadyZoomed) {
      zoomToTrail(selectedTrail)
      zoomedTrailIdRef.current = trailId
    }

    // Clear flags after processing
    shouldZoomRef.current = false
    isInitialLoadRef.current = false
  }, [selectedTrail, params.gid, map, zoomToTrail])

  // Extract trail ID from URL params - using primitive value as dependency
  // to avoid re-running effect when trail object reference changes
  const selectedTrailId = params.type === 'trail' && params.gid ? parseInt(params.gid, 10) : null

  // Fetch and highlight trail geometry when a trail is selected
  useEffect(() => {
    if (!map) {
      return
    }

    if (!selectedTrailId || isNaN(selectedTrailId)) {
      currentTrailRef.current = null
      clearTrailHighlight(map)
      return
    }

    currentTrailRef.current = selectedTrailId
    clearTrailHighlight(map)

    getTrailGeometry(selectedTrailId)
      .then((geometry) => {
        if (currentTrailRef.current === selectedTrailId && geometry && map) {
          highlightTrailLine(map, geometry)
        }
      })
      .catch((error) => {
        console.error('Error highlighting trail:', error)
      })

    return () => {
      if (currentTrailRef.current === selectedTrailId) {
        currentTrailRef.current = null
      }
    }
  }, [selectedTrailId, map])

  // Clear highlight when component unmounts
  useEffect(() => {
    return () => {
      currentTrailRef.current = null
      if (map) {
        clearTrailHighlight(map)
      }
    }
  }, [map])

  // Show detail view if a trail is selected
  if (selectedTrail) {
    const distancetext = (selectedTrail as Record<string, unknown>).distancetext as string | undefined
    const durationtext_hike = (selectedTrail as Record<string, unknown>).durationtext_hike as string | undefined
    const durationtext_bike = (selectedTrail as Record<string, unknown>).durationtext_bike as string | undefined
    const durationtext_bridle = (selectedTrail as Record<string, unknown>).durationtext_bridle as string | undefined
    const description = (selectedTrail as Record<string, unknown>).description as string | undefined

    return (
      <Box p="md" style={{ position: 'relative' }}>
        <Stack spacing="md">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => {
              // Clear trail highlight
              clearTrailHighlight(map)
              // Reset zoom tracking
              zoomedTrailIdRef.current = null
              // Clear trail from URL (this will clear selectedTrail via derived state)
              setParams({ type: null, gid: null }, false, true)
            }}
            style={{ alignSelf: 'flex-start' }}
          >
            ← Trails
          </Button>

          <Text size="lg" weight={500}>
            {String(selectedTrail.name)}
          </Text>

          <Stack spacing="xs">
            {distancetext && (
              <Text size="sm">
                <span style={{ fontWeight: 600 }}>Length:</span> {distancetext}
              </Text>
            )}

            {selectedTrail.hike && durationtext_hike && (
              <Text size="sm">
                <span style={{ fontWeight: 600 }}>Est time, walking:</span> {durationtext_hike}
              </Text>
            )}

            {selectedTrail.bike && durationtext_bike && (
              <Text size="sm">
                <span style={{ fontWeight: 600 }}>Est time, bicycle:</span> {durationtext_bike}
              </Text>
            )}

            {selectedTrail.bridle && durationtext_bridle && (
              <Text size="sm">
                <span style={{ fontWeight: 600 }}>Est time, horseback:</span> {durationtext_bridle}
              </Text>
            )}
          </Stack>

          {description && (
            <>
              <Divider />
              <Text
                size="sm"
                style={{ whiteSpace: 'pre-wrap' }}
                dangerouslySetInnerHTML={{
                  __html: description,
                }}
              />
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
          Trails
        </Text>

        {isLoading && (
          <Box style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader size="sm" />
          </Box>
        )}

        {isError && (
          <Alert color="red" title="Error loading trails">
            {error?.message || 'Failed to load trails. Please try again later.'}
          </Alert>
        )}

        {!isLoading && !isError && trails && parks && (
          <>
            <Select
              label="Filter by Park"
              placeholder="Select a park"
              data={reservationOptions}
              value={selectedReservationId || ''}
              onChange={(value) => setSelectedReservationId(value || null)}
              clearable
            />

            {filteredTrails.length === 0 ? (
              <Text size="sm" color="dimmed">
                {selectedReservationId ? 'No trails found for the selected park.' : 'No trails found.'}
              </Text>
            ) : (
              <Stack spacing={0}>
                <Text size="sm" weight={500} color="dimmed">
                  {filteredTrails.length} {filteredTrails.length === 1 ? 'trail' : 'trails'}
                </Text>
                {filteredTrails.map((trail, index) => {
                  const trailData = trail as Record<string, unknown>
                  const trailRes = trailData.res as string | undefined
                  const distancetext = trailData.distancetext as string | undefined

                  return (
                    <Box
                      key={String(trail.id)}
                      p="sm"
                      style={{
                        border: '1px solid #e0e0e0',
                        borderTop: index === 0 ? '1px solid #e0e0e0' : 'none',
                        borderRadius: index === 0 ? '4px 4px 0 0' : index === filteredTrails.length - 1 ? '0 0 4px 4px' : '0',
                        cursor: 'pointer',
                      }}
                      sx={{
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                        },
                      }}
                      onClick={() => {
                        // Mark that we want to zoom (user initiated)
                        shouldZoomRef.current = true
                        // Update URL with trail selection (pushState for back button)
                        // This will update selectedTrail via derived state
                        setParams(
                          {
                            type: 'trail',
                            gid: String(trail.id),
                          },
                          false,
                          true
                        )
                      }}
                    >
                      <Group position="apart" noWrap>
                        <Box style={{ minWidth: 0 }}>
                          <Text size="sm" weight={500}>
                            {String(trail.name)}
                          </Text>
                          {trailRes && (
                            <Text size="xs" color="dimmed" mt={2}>
                              {trailRes}
                            </Text>
                          )}
                        </Box>
                        {distancetext && (
                          <Badge
                            size="md"
                            style={{
                              flexShrink: 0,
                              backgroundColor: '#1D5C1F',
                              color: 'white',
                              paddingLeft: 8,
                              paddingRight: 8,
                              textTransform: 'none',
                            }}
                          >
                            {abbreviateDistance(distancetext)}
                          </Badge>
                        )}
                      </Group>
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
