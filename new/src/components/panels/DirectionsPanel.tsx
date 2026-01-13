import { Text, Box, Stack } from '@mantine/core'

interface DirectionsPanelProps {
  onClose: () => void
}

export function DirectionsPanel({ onClose: _onClose }: DirectionsPanelProps) {
  return (
    <Box p="md" pr="sm" style={{ position: 'relative' }}>
      <Stack spacing="md">
        <Text size="lg" weight={500}>
          Get Directions
        </Text>

        <Text size="sm" color="dimmed">
          Directions functionality coming soon...
        </Text>
      </Stack>
    </Box>
  )
}
