import { Text, Box, Stack, Loader, Alert, Button, Anchor, Divider } from '@mantine/core'
import { useState, useEffect } from 'react'
import { useParksData } from '../../hooks/useParksData'
import { makeImageFromPagethumbnail } from '../../lib/dataTransform'
import { useMap } from '../../contexts/MapContext'
import { zoomToFeature, highlightParkBoundary, clearParkHighlight } from '../../lib/mapUtils'
import type { Reservation } from '../../types/api'

interface ParksPanelProps {
  onClose: () => void
}

export function ParksPanel({ onClose }: ParksPanelProps) {
  const { data: parks, isLoading, isError, error } = useParksData()
  const [selectedPark, setSelectedPark] = useState<Reservation | null>(null)
  const { map } = useMap()

  // Clear highlight when component unmounts or park is selected
  useEffect(() => {
    return () => {
      clearParkHighlight(map)
    }
  }, [map])

  useEffect(() => {
    if (selectedPark) {
      clearParkHighlight(map)
    }
  }, [selectedPark, map])

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
            ← Parks
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
                {parks.map((park, index) => {
                  const parkData = park as Record<string, unknown>
                  const hasBoundingBox =
                    parkData.boxw &&
                    parkData.boxs &&
                    parkData.boxe &&
                    parkData.boxn &&
                    parkData.boxw !== 0 &&
                    parkData.boxs !== 0 &&
                    parkData.boxe !== 0 &&
                    parkData.boxn !== 0

                  return (
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
                      onMouseEnter={() => {
                        // Highlight park boundary on hover
                        if (hasBoundingBox) {
                          highlightParkBoundary(map, {
                            w: parkData.boxw as number,
                            s: parkData.boxs as number,
                            e: parkData.boxe as number,
                            n: parkData.boxn as number,
                          })
                        }
                      }}
                      onMouseLeave={() => {
                        // Clear highlight when mouse leaves
                        clearParkHighlight(map)
                      }}
                      onClick={() => {
                        setSelectedPark(park)
                        // Zoom to park on map
                        if (hasBoundingBox) {
                          // Use bounding box if available
                          zoomToFeature(map, {
                            w: parkData.boxw as number,
                            s: parkData.boxs as number,
                            e: parkData.boxe as number,
                            n: parkData.boxn as number,
                          })
                        } else if (park.latitude && park.longitude) {
                          // Fall back to lat/lng
                          zoomToFeature(map, {
                            lat: park.latitude,
                            lng: park.longitude,
                          })
                        }
                      }}
                    >
                      <Text size="sm" weight={500}>
                        {park.pagetitle}
                      </Text>
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
