import { Text, Box, Stack, Loader, Alert, Image } from '@mantine/core'
import { useState } from 'react'
import { useActivitiesData, useAttractionsByActivity } from '../../hooks/useActivitiesData'

interface ActivitiesPanelProps {
  onClose: () => void
}

export function ActivitiesPanel({ onClose }: ActivitiesPanelProps) {
  const { activities, attractions, isLoading, isError, error } = useActivitiesData()
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null)
  const { attractions: filteredAttractions } = useAttractionsByActivity(
    selectedActivityId
  )

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

  return (
    <Box p="md" style={{ position: 'relative' }}>
      <Stack spacing="md">
        <Text size="lg" weight={500}>
          Activities
        </Text>

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
                          <Box
                            style={{
                              flexShrink: 0,
                              width: '28px',
                              height: '28px',
                              border: '2px solid #373735',
                              borderRadius: '4px',
                              backgroundColor: '#373735',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Image
                              src={activity.icon}
                              alt={activity.pagetitle}
                              w={24}
                              h={24}
                              style={{
                                width: '24px',
                                height: '24px',
                                maxWidth: '24px',
                                maxHeight: '24px',
                                objectFit: 'contain'
                              }}
                            />
                          </Box>
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
                <Box
                  p="sm"
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: '#f5f5f5',
                  }}
                  onClick={() => setSelectedActivityId(null)}
                >
                  <Text size="sm" weight={500}>
                    ← Back to Activities
                  </Text>
                </Box>

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
                    {filteredAttractions.map((attraction, index) => (
                      <Box
                        key={attraction.gis_id || attraction.record_id}
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
                          // TODO: Handle attraction click - center map, show details, etc.
                          console.log('Attraction clicked:', attraction)
                        }}
                      >
                        <Text size="sm" weight={500}>
                          {attraction.pagetitle}
                        </Text>
                      </Box>
                    ))}
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
