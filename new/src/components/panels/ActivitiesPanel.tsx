import { Text, Box, Stack, Loader, Alert, Anchor, Divider, Group } from '@mantine/core'
import { Clock, Phone } from 'tabler-icons-react'
import { PanelList } from '../PanelList'
import { PanelHeader } from '../PanelHeader'
import { BackButton } from '../BackButton'
import { ShareButton } from '../ShareButton'
import { useMemo, useEffect, useRef, useCallback } from 'react'
import { useActivitiesData, useAttractionsByActivity } from '../../hooks/useActivitiesData'
import { useCategoriesData } from '../../hooks/useCategoriesData'
import { useParksData } from '../../hooks/useParksData'
import { useMap } from '../../contexts/MapContext'
import { zoomToFeature, placeAttractionMarker, clearAttractionMarker } from '../../lib/mapUtils'
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
    const sortedActivityIcons = [...activityIcons].sort((a, b) =>
      String(a?.pagetitle ?? '').localeCompare(String(b?.pagetitle ?? ''))
    )

    return (
      <Box p="md" pr="sm" style={{ position: 'relative' }}>
        <PanelHeader title="Activities" />
        <Stack spacing="md">
          <BackButton
            onClick={() => {
              // Reset zoom tracking
              zoomedAttractionIdRef.current = null
              // Clear attraction from URL, keep activity if present
              // This will clear selectedAttraction via derived state
              setParams({ type: null, gid: null }, false, true)
            }}
          />

          <Text size="lg" weight={900}>
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
                {sortedActivityIcons.map((activity) => (
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
              <Group spacing="xs" align="flex-start">
                <Clock size={20} style={{ color: '#6AB03E', flexShrink: 0, marginTop: 2 }} />
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {hoursofoperation}
                </Text>
              </Group>
              <Divider />
            </>
          )}

          {phone && (
            <>
              <Group spacing="xs" align="center">
                <Phone size={20} style={{ color: '#6AB03E', flexShrink: 0 }} />
                <Anchor href={`tel:${phone}`} size="sm" className="phone-link">
                  {phone}
                </Anchor>
              </Group>
              <Divider />
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

          <ShareButton />
        </Stack>
      </Box>
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
