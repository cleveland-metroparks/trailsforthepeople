import { Text, Box, Stack } from '@mantine/core'

interface TrailsPanelProps {
  onClose: () => void
}

export function TrailsPanel({ onClose }: TrailsPanelProps) {
  return (
    <Box p="md" style={{ position: 'relative' }}>
      <Stack spacing="md">
        <Text size="lg" weight={500}>
          Trails
        </Text>

        <Text size="sm" color="dimmed">
          Trail listings coming soon...
        </Text>
      </Stack>
    </Box>
  )
}
