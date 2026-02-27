import { Text, Box, Stack, Loader, Alert } from '@mantine/core'
import { PanelList } from '../PanelList'
import { PanelHeader } from '../PanelHeader'
import { BackButton } from '../BackButton'
import { useMemo, useEffect, useRef, useCallback } from 'react'
import { useActivitiesData, useAttractionsByActivity } from '../../hooks/useActivitiesData'
import { useCategoriesData } from '../../hooks/useCategoriesData'
import { useParksData } from '../../hooks/useParksData'
import { useMap } from '../../contexts/MapContext'
import { zoomToFeature, placeAttractionMarker, clearAttractionMarker } from '../../lib/mapUtils'
import { useSidebarAwarePadding } from '../../hooks/useSidebarAwarePadding'
import { ActivityIcon } from '../ActivityIcon'
import { useURLState } from '../../hooks/useURLState'
import type { TransformedAttraction } from '../../types/api'
import { AttractionDetailPane } from './details/AttractionDetailPane'

interface ActivitiesPanelProps {
  onClose: () => void
}

export function ActivitiesPanel({ onClose: _onClose }: ActivitiesPanelProps) {
  const { activities, attractions, isLoading, isError, error } = useActivitiesData()
  const { params, setParams } = useURLState()
  const sidebarAwarePadding = useSidebarAwarePadding(120)

  // Track whether we should zoom (only on user click, not URL restoration)
  const shouldZoomRef = useRef(false)
  // Track the attraction ID we've zoomed to (to avoid duplicate zooms)
  const zoomedAttractionIdRef = useRef<string | null>(null)
  // Track if this is the initial load (to zoom to attraction from URL on page load)
  const isInitialLoadRef = useRef(true)

  // SINGLE SOURCE OF TRUTH: Derive selectedActivityId from URL params
  const selectedActivityId = useMemo(() => {
    if (!params.activityId) return null
    const activityId = parseInt(params.activityId, 10)
    return isNaN(activityId) ? null : activityId
  }, [params.activityId])

  const { attractions: filteredAttractions } = useAttractionsByActivity(
    selectedActivityId
  )
  const sortedAttractions = useMemo(() => {
    return [...filteredAttractions].sort((a, b) =>
      String(a?.pagetitle ?? '').localeCompare(String(b?.pagetitle ?? ''))
    )
  }, [filteredAttractions])
  const { categoriesMap } = useCategoriesData()
  const { data: parks } = useParksData()
  const { map } = useMap()

  // SINGLE SOURCE OF TRUTH: Derive selectedAttraction from URL params
  const selectedAttraction = useMemo(() => {
    if (!attractions || params.type !== 'attraction' || !params.gid) {
      return null
    }
    return attractions.find(
      (a) => String(a.gis_id || a.record_id) === params.gid
    ) || null
  }, [attractions, params.type, params.gid])

  // Clear invalid attraction selections (e.g., gis_id not found)
  useEffect(() => {
    if (params.type !== 'attraction' || !params.gid) return
    if (isLoading || !attractions) return

    const hasMatch = attractions.some(
      (a) => String(a.gis_id || a.record_id) === params.gid
    )

    if (!hasMatch) {
      setParams({ type: null, gid: null }, false, false)
    }
  }, [params.type, params.gid, isLoading, attractions, setParams])

  // Helper to zoom to an attraction
  const zoomToAttraction = useCallback((attraction: TransformedAttraction) => {
    if (!map) return
    const attractionData = attraction as Record<string, unknown>
    const lat = attractionData.latitude as number | undefined
    const lng = attractionData.longitude as number | undefined
    if (lat && lng) {
      zoomToFeature(map, { lat, lng }, { padding: sidebarAwarePadding })
    }
  }, [map, sidebarAwarePadding])

  // Handle zoom: on user click OR initial page load with attraction in URL
  useEffect(() => {
    if (!selectedAttraction || !map) return

    const attractionId = params.gid ?? null
    const alreadyZoomed = attractionId === zoomedAttractionIdRef.current

    // Zoom if: user clicked (shouldZoomRef) OR initial load with attraction in URL
    if ((shouldZoomRef.current || isInitialLoadRef.current) && !alreadyZoomed) {
      zoomToAttraction(selectedAttraction)
      zoomedAttractionIdRef.current = attractionId
    }

    // Clear flags after processing
    shouldZoomRef.current = false
    isInitialLoadRef.current = false
  }, [selectedAttraction, params.gid, map, zoomToAttraction])

  // Place marker when attraction is selected
  useEffect(() => {
    if (!map) return

    if (selectedAttraction && params.type === 'attraction') {
      const attractionData = selectedAttraction as Record<string, unknown>
      const lat = attractionData.latitude as number | undefined
      const lng = attractionData.longitude as number | undefined
      if (lat && lng) {
        placeAttractionMarker(map, lat, lng)
      }
    } else {
      // Clear marker when no attraction is selected or type changes
      clearAttractionMarker(map)
    }
  }, [selectedAttraction, params.type, map])

  // Create a map of reservation ID to park name for quick lookup
  const parksMap = useMemo(() => {
    if (!parks) return new Map<number | string, string>()
    const map = new Map<number | string, string>()
    parks.forEach((park) => {
      map.set(park.record_id, park.pagetitle)
    })
    return map
  }, [parks])

  // Filter activities to only show those with icons and associated attractions
  const activitiesWithAttractions = activities.filter((activity) => {
    if (!activity.icon) return false
    // Check if this activity has any associated attractions
    const hasAttractions = attractions.some(
      (attraction) =>
        attraction.activities && attraction.activities.includes(activity.eventactivitytypeid)
    )
    return hasAttractions
  })

  // Sort activities alphabetically
  const sortedActivities = [...activitiesWithAttractions].sort((a, b) =>
    a.pagetitle.localeCompare(b.pagetitle)
  )

  // Get selected activity for display
  const selectedActivity = selectedActivityId
    ? activities.find((a) => a.eventactivitytypeid === selectedActivityId)
    : null

  // Show attraction detail view if selected
  if (selectedAttraction) {
    return (
      <AttractionDetailPane
        panelTitle="Activities"
        attraction={selectedAttraction}
        categoriesMap={categoriesMap}
        activities={activities}
        backButton={
          <BackButton
            onClick={() => {
              // Reset zoom tracking
              zoomedAttractionIdRef.current = null
              // Clear attraction from URL, keep activity if present
              // This will clear selectedAttraction via derived state
              setParams({ type: null, gid: null }, false, true)
            }}
          />
        }
      />
    )
  }

  return (
    <Box p="md" pr="sm" style={{ position: 'relative' }}>
      <PanelHeader title="Activities" />
      <Stack spacing="md">
        {isLoading && (
          <Box style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader size="sm" />
          </Box>
        )}

        {isError && (
          <Alert color="red" title="Error loading activities">
            {error?.message || 'Failed to load activities. Please try again later.'}
          </Alert>
        )}

        {!isLoading && !isError && (
          <>
            {selectedActivityId === null ? (
              <PanelList
                items={sortedActivities}
                keyExtractor={(activity) => String(activity.eventactivitytypeid)}
                countLabel={{ singular: 'activity', plural: 'activities' }}
                emptyMessage="No activities found."
                onClick={(activity) => {
                  // Update URL with activity selection (pushState for back button)
                  // This will update selectedActivityId via derived state
                  setParams(
                    {
                      activityId: String(activity.eventactivitytypeid),
                      type: null, // Clear any previous feature selection
                      gid: null,
                    },
                    false,
                    true
                  )
                }}
                renderItem={(activity) => (
                  <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {activity.icon && (
                      <ActivityIcon
                        icon={activity.icon}
                        alt={activity.pagetitle}
                        title={activity.pagetitle}
                        size={24}
                      />
                    )}
                    <Text size="sm" weight={500} style={{ flex: 1 }}>
                      {activity.pagetitle}
                    </Text>
                  </Box>
                )}
              />
            ) : (
              <>
                <BackButton
                  onClick={() => {
                    // Clear activity from URL (this will clear selectedActivityId via derived state)
                    setParams({ activityId: null }, false, true)
                  }}
                />

                <Text size="md" weight={500}>
                  {selectedActivity?.pagetitle}
                </Text>

                <PanelList
                  items={sortedAttractions}
                  keyExtractor={(attraction, index) => String(attraction.gis_id || attraction.record_id || index)}
                  countLabel={{ singular: 'attraction', plural: 'attractions' }}
                  emptyMessage="No attractions found for this activity."
                  onClick={(attraction) => {
                    // Mark that we want to zoom (user initiated)
                    shouldZoomRef.current = true
                    // Update URL with attraction selection (pushState for back button)
                    // This will update selectedAttraction via derived state
                    setParams(
                      {
                        type: 'attraction',
                        gid: String(attraction.gis_id || attraction.record_id),
                        activityId: selectedActivityId ? String(selectedActivityId) : null,
                      },
                      false,
                      true
                    )
                  }}
                  renderItem={(attraction) => {
                    const attractionData = attraction as Record<string, unknown>
                    const reservationId = attractionData.reservation as number | string | undefined
                    const parkName = reservationId ? parksMap.get(reservationId) : undefined

                    return (
                      <>
                        <Text size="sm" weight={500}>
                          {String(attraction.pagetitle)}
                        </Text>
                        {parkName && (
                          <Text size="xs" color="dimmed" mt={2}>
                            {parkName}
                          </Text>
                        )}
                      </>
                    )
                  }}
                />
              </>
            )}
          </>
        )}
      </Stack>
    </Box>
  )
}
