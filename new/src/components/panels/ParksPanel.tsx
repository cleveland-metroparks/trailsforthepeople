import { Text, Box, Stack, Loader, Alert } from '@mantine/core'
import { useParksData } from '../../hooks/useParksData'

interface ParksPanelProps {
  onClose: () => void
}

export function ParksPanel({ onClose }: ParksPanelProps) {
  const { data: parks, isLoading, isError, error } = useParksData()

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
                {parks.map((park, index) => (
                  <Box
                    key={park.record_id}
                    p="sm"
                    style={{
                      border: '1px solid #e0e0e0',
                      borderTop: index === 0 ? '1px solid #e0e0e0' : 'none',
                      borderRadius: index === 0 ? '4px 4px 0 0' : index === parks.length - 1 ? '0 0 4px 4px' : '0',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      // TODO: Handle park click - center map, show details, etc.
                      console.log('Park clicked:', park)
                    }}
                  >
                    <Text size="sm" weight={500}>
                      {park.pagetitle}
                    </Text>
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
