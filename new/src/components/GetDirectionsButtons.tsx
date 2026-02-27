import { Box, Text } from '@mantine/core'
import { useDirections, type DirectionsTarget } from '../contexts/DirectionsContext'
import { ViaModeSelector } from './ViaModeSelector'

interface GetDirectionsButtonsProps {
  target: DirectionsTarget
}

export function GetDirectionsButtons({ target }: GetDirectionsButtonsProps) {
  const { openDirections } = useDirections()

  return (
    <Box>
      <Text size="sm" weight={600} mb={6}>
        Get Directions
      </Text>
      <ViaModeSelector
        value="hike"
        onChange={(via) => openDirections(target, via)}
        variant="compact"
      />
    </Box>
  )
}
