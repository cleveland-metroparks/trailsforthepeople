import { Text, Box, Stack, Loader, Alert, Button, Anchor, Divider } from '@mantine/core'
import { useState } from 'react'
import { useParksData } from '../../hooks/useParksData'
import { makeImageFromPagethumbnail } from '../../lib/dataTransform'
import type { Reservation } from '../../types/api'

interface ParksPanelProps {
  onClose: () => void
}

export function ParksPanel({ onClose }: ParksPanelProps) {
  const { data: parks, isLoading, isError, error } = useParksData()
  const [selectedPark, setSelectedPark] = useState<Reservation | null>(null)

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
            onClick={() => setSelectedPark(null)}
            style={{ alignSelf: 'flex-start' }}
          >
            ← Back
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
                    sx={{
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                    }}
                    onClick={() => {
                      setSelectedPark(park)
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
