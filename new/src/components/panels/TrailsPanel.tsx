import { Text, Box, Stack, Loader, Alert, Select, Badge, Group } from '@mantine/core'
import { PanelList } from '../PanelList'
import { PanelHeader } from '../PanelHeader'
import { BackButton } from '../BackButton'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useTrailsData } from '../../hooks/useTrailsData'
import { useParksData } from '../../hooks/useParksData'
import { useSidebarAwarePadding } from '../../hooks/useSidebarAwarePadding'
import { useMap } from '../../contexts/MapContext'
import { zoomToFeature, highlightTrailLine, clearTrailHighlight, clearAttractionMarker } from '../../lib/mapUtils'
import { getTrailGeometry } from '../../lib/api'
import { useURLState } from '../../hooks/useURLState'
import type { TransformedTrail } from '../../types/api'
import { TrailDetailPane } from './details/TrailDetailPane'

// Abbreviate distance units for compact display
function abbreviateDistance(text: string): string {
  return text.replace(/Miles?/gi, 'mi').replace(/Feet/gi, 'ft')
}

interface TrailsPanelProps {
  onClose: () => void
}

export function TrailsPanel(_props: TrailsPanelProps) {
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
    if (!selectedReservationId) {
      return [...trails].sort((a, b) =>
        String(a?.name ?? '').localeCompare(String(b?.name ?? ''))
      )
    }

    // Filter trails that belong to the selected reservation
    // Note: The old code uses trail['res'] and compares with reservation pagetitle
    // This matches the old implementation where the dropdown value is pagetitle
    const trailsForReservation = trails.filter((trail) => {
      const trailRes = (trail as { res?: string | number })['res']
      if (trailRes === undefined) return false

      // Compare with selected reservation (which is pagetitle in old code)
      return String(trailRes) === String(selectedReservationId)
    })
    return trailsForReservation.sort((a, b) =>
      String(a?.name ?? '').localeCompare(String(b?.name ?? ''))
    )
  }, [trails, selectedReservationId])

  // Prepare reservation options for dropdown
  // Note: Old code uses pagetitle as the value (see pane_trails_reservation_filter_option.hbs)
  const reservationOptions = useMemo(() => {
    if (!parks) return []
    const sortedParks = [...parks].sort((a, b) =>
      String(a?.pagetitle ?? '').localeCompare(String(b?.pagetitle ?? ''))
    )
    return [
      { value: '', label: 'All Parks' },
      ...sortedParks.map((park) => ({
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
    clearAttractionMarker(map) // Clear attraction marker when trail is selected

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
    return (
      <TrailDetailPane
        panelTitle="Trails"
        trail={selectedTrail}
        backButton={
          <BackButton
            onClick={() => {
              // Clear trail highlight
              clearTrailHighlight(map)
              // Reset zoom tracking
              zoomedTrailIdRef.current = null
              // Clear trail from URL (this will clear selectedTrail via derived state)
              setParams({ type: null, gid: null }, false, true)
            }}
          />
        }
      />
    )
  }

  return (
    <Box p="md" pr="sm" style={{ position: 'relative' }}>
      <PanelHeader title="Trails" />
      <Stack spacing="md">
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

            <PanelList
              items={filteredTrails}
              keyExtractor={(trail) => String(trail.id)}
              countLabel={{ singular: 'trail', plural: 'trails' }}
              emptyMessage={selectedReservationId ? 'No trails found for the selected park.' : 'No trails found.'}
              onClick={(trail) => {
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
              renderItem={(trail) => {
                const trailData = trail as Record<string, unknown>
                const trailRes = trailData.res as string | undefined
                const distancetext = trailData.distancetext as string | undefined

                return (
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
                        size="lg"
                        style={{
                          flexShrink: 0,
                          backgroundColor: '#43424a',
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
                )
              }}
            />
          </>
        )}
      </Stack>
    </Box>
  )
}
