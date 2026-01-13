import { Text, Box, Stack, Loader, Alert, Button, Anchor, Divider } from '@mantine/core'
import { useMemo, useEffect, useRef, useCallback } from 'react'
import { useActivitiesData, useAttractionsByActivity } from '../../hooks/useActivitiesData'
import { useCategoriesData } from '../../hooks/useCategoriesData'
import { useParksData } from '../../hooks/useParksData'
import { useMap } from '../../contexts/MapContext'
import { zoomToFeature } from '../../lib/mapUtils'
import { useSidebarAwarePadding } from '../../hooks/useSidebarAwarePadding'
import { makeImageFromPagethumbnail } from '../../lib/dataTransform'
import { ActivityIcon } from '../ActivityIcon'
import { useURLState } from '../../hooks/useURLState'
import type { TransformedAttraction } from '../../types/api'

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

  // Get selected activity name for back button
  const selectedActivity = selectedActivityId
    ? activities.find((a) => a.eventactivitytypeid === selectedActivityId)
    : null

  // Show attraction detail view if selected
  if (selectedAttraction) {
    const pagethumbnail = (selectedAttraction as Record<string, unknown>).pagethumbnail as string | undefined
    const imgProps = makeImageFromPagethumbnail(pagethumbnail, 320)
    const descr = (selectedAttraction as Record<string, unknown>).descr as string | undefined
    const hoursofoperation = (selectedAttraction as Record<string, unknown>).hoursofoperation as string | undefined
    const phone = (selectedAttraction as Record<string, unknown>).phone as string | undefined
    const cmp_url = (selectedAttraction as Record<string, unknown>).cmp_url as string | undefined

    // Get category names
    const categoryNames = selectedAttraction.categories
      ? selectedAttraction.categories
          .map((id) => categoriesMap[id])
          .filter((name) => name)
          .join(', ')
      : null

    // Get activity icons for this attraction
    const activityIcons = selectedAttraction.activities
      ? selectedAttraction.activities
          .map((activityId) => activities.find((a) => a.eventactivitytypeid === activityId))
          .filter((activity): activity is typeof activity & { icon: string } =>
            activity !== undefined && activity.icon !== null
          )
      : []

    return (
      <Box p="md" pr="sm" style={{ position: 'relative' }}>
        <Stack spacing="md">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => {
              // Reset zoom tracking
              zoomedAttractionIdRef.current = null
              // Clear attraction from URL, keep activity if present
              // This will clear selectedAttraction via derived state
              setParams({ type: null, gid: null }, false, true)
            }}
            style={{ alignSelf: 'flex-start' }}
          >
            ← {selectedActivity?.pagetitle || 'Activities'}
          </Button>

          <Text size="lg" weight={500}>
            {String(selectedAttraction.pagetitle)}
          </Text>

          {categoryNames && (
            <Text size="sm" color="dimmed">
              {categoryNames}
            </Text>
          )}

          {activityIcons.length > 0 && (
            <Box>
              <Text size="sm" weight={500} mb="xs">
                Activities:
              </Text>
              <Box
                component="ul"
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5em',
                }}
              >
                {activityIcons.map((activity) => (
                  <Box
                    key={activity.eventactivitytypeid}
                    component="li"
                    style={{
                      display: 'inline-block',
                    }}
                  >
                    <ActivityIcon
                      icon={activity.icon}
                      alt={activity.pagetitle}
                      title={activity.pagetitle}
                      size={24}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {imgProps && (
            <Box>
              <img
                src={imgProps.src}
                width={imgProps.width}
                height={imgProps.height}
                alt={String(selectedAttraction.pagetitle)}
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

          {cmp_url && (
            <>
              <Divider />
              <Box>
                <Anchor href={cmp_url.startsWith('/') ? `https://www.clevelandmetroparks.com${cmp_url}` : cmp_url} target="_blank" size="sm">
                  More info on clevelandmetroparks.com
                </Anchor>
              </Box>
            </>
          )}
        </Stack>
      </Box>
    )
  }

  return (
    <Box p="md" pr="sm" style={{ position: 'relative' }}>
      <Stack spacing="md">
        {selectedActivityId === null && (
          <Text size="lg" weight={500}>
            Activities
          </Text>
        )}

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
              <>
                {sortedActivities.length === 0 ? (
                  <Text size="sm" color="dimmed">
                    No activities found.
                  </Text>
                ) : (
                  <Stack spacing={0}>
                    <Text size="sm" weight={500} color="dimmed">
                      {sortedActivities.length} {sortedActivities.length === 1 ? 'activity' : 'activities'}
                    </Text>
                    {sortedActivities.map((activity, index) => (
                      <Box
                        key={activity.eventactivitytypeid}
                        p="sm"
                        style={{
                          border: '1px solid #e0e0e0',
                          borderTop: index === 0 ? '1px solid #e0e0e0' : 'none',
                          borderRadius: index === 0 ? '4px 4px 0 0' : index === sortedActivities.length - 1 ? '0 0 4px 4px' : '0',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                        sx={{
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                          },
                        }}
                        onClick={() => {
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
                      >
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
                    ))}
                  </Stack>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => {
                    // Clear activity from URL (this will clear selectedActivityId via derived state)
                    setParams({ activityId: null }, false, true)
                  }}
                  style={{ alignSelf: 'flex-start' }}
                >
                  ← Activities
                </Button>

                <Text size="md" weight={500}>
                  {
                    activities.find((a) => a.eventactivitytypeid === selectedActivityId)
                      ?.pagetitle
                  }
                </Text>

                {filteredAttractions.length === 0 ? (
                  <Text size="sm" color="dimmed">
                    No attractions found for this activity.
                  </Text>
                ) : (
                  <Stack spacing={0}>
                    <Text size="sm" weight={500} color="dimmed">
                      {filteredAttractions.length}{' '}
                      {filteredAttractions.length === 1 ? 'attraction' : 'attractions'}
                    </Text>
                    {filteredAttractions.map((attraction, index) => {
                      const attractionData = attraction as Record<string, unknown>
                      const reservationId = attractionData.reservation as number | string | undefined
                      const parkName = reservationId ? parksMap.get(reservationId) : undefined

                      return (
                        <Box
                          key={String(attraction.gis_id || attraction.record_id || index)}
                          p="sm"
                          style={{
                            border: '1px solid #e0e0e0',
                            borderTop: index === 0 ? '1px solid #e0e0e0' : 'none',
                            borderRadius: index === 0 ? '4px 4px 0 0' : index === filteredAttractions.length - 1 ? '0 0 4px 4px' : '0',
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
                        >
                          <Text size="sm" weight={500}>
                            {String(attraction.pagetitle)}
                          </Text>
                          {parkName && (
                            <Text size="xs" color="dimmed" mt={2}>
                              {parkName}
                            </Text>
                          )}
                        </Box>
                      )
                    })}
                  </Stack>
                )}
              </>
            )}
          </>
        )}
      </Stack>
    </Box>
  )
}
