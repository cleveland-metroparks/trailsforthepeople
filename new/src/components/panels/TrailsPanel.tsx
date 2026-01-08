import { Text, Box, Stack, Loader, Alert, Select } from '@mantine/core'
import { useState, useMemo } from 'react'
import { useTrailsData } from '../../hooks/useTrailsData'
import { useParksData } from '../../hooks/useParksData'

interface TrailsPanelProps {
  onClose: () => void
}

export function TrailsPanel({ onClose }: TrailsPanelProps) {
  const { data: trails, isLoading: trailsLoading, isError: trailsError, error: trailsErrorObj } = useTrailsData()
  const { data: parks, isLoading: parksLoading, isError: parksError, error: parksErrorObj } = useParksData()
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null)

  const isLoading = trailsLoading || parksLoading
  const isError = trailsError || parksError
  const error = trailsErrorObj || parksErrorObj

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
                {filteredTrails.map((trail, index) => (
                  <Box
                    key={trail.id}
                    p="sm"
                    style={{
                      border: '1px solid #e0e0e0',
                      borderTop: index === 0 ? '1px solid #e0e0e0' : 'none',
                      borderRadius: index === 0 ? '4px 4px 0 0' : index === filteredTrails.length - 1 ? '0 0 4px 4px' : '0',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      // TODO: Handle trail click - center map, show details, etc.
                      console.log('Trail clicked:', trail)
                    }}
                  >
                    <Text size="sm" weight={500}>
                      {trail.name}
                    </Text>
                    <Box style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      {trail.hike && (
                        <Text size="xs" color="dimmed">
                          Hiking
                        </Text>
                      )}
                      {trail.bike && (
                        <Text size="xs" color="dimmed">
                          Biking
                        </Text>
                      )}
                      {trail.mountainbike && (
                        <Text size="xs" color="dimmed">
                          Mountain Biking
                        </Text>
                      )}
                      {trail.bridle && (
                        <Text size="xs" color="dimmed">
                          Horseback
                        </Text>
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Box>
  )
}
