import { Text, Box, Stack, Loader, Alert, Button, Anchor, Divider } from '@mantine/core'
import { useState, useMemo } from 'react'
import { useActivitiesData, useAttractionsByActivity } from '../../hooks/useActivitiesData'
import { useCategoriesData } from '../../hooks/useCategoriesData'
import { useParksData } from '../../hooks/useParksData'
import { useMap } from '../../contexts/MapContext'
import { zoomToFeature } from '../../lib/mapUtils'
import { makeImageFromPagethumbnail } from '../../lib/dataTransform'
import { ActivityIcon } from '../ActivityIcon'
import type { TransformedAttraction } from '../../types/api'

interface ActivitiesPanelProps {
  onClose: () => void
}

export function ActivitiesPanel({ onClose }: ActivitiesPanelProps) {
  const { activities, attractions, isLoading, isError, error } = useActivitiesData()
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null)
  const [selectedAttraction, setSelectedAttraction] = useState<TransformedAttraction | null>(null)
  const { attractions: filteredAttractions } = useAttractionsByActivity(
    selectedActivityId
  )
  const { categoriesMap } = useCategoriesData()
  const { data: parks } = useParksData()
  const { map } = useMap()

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
      <Box p="md" style={{ position: 'relative' }}>
        <Stack spacing="md">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => setSelectedAttraction(null)}
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
                  More info
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
                        onClick={() => setSelectedActivityId(activity.eventactivitytypeid)}
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
                  onClick={() => setSelectedActivityId(null)}
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
                            setSelectedAttraction(attraction)
                            // Zoom to attraction on map
                            const lat = attractionData.latitude as number | undefined
                            const lng = attractionData.longitude as number | undefined
                            if (lat && lng) {
                              zoomToFeature(map, {
                                lat,
                                lng,
                              })
                            }
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
