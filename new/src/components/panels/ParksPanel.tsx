import { Text, Box, Stack } from '@mantine/core'

interface ParksPanelProps {
  onClose: () => void
}

export function ParksPanel({ onClose }: ParksPanelProps) {
  return (
    <Box p="md" style={{ position: 'relative' }}>
      <Stack spacing="md">
        <Text size="lg" weight={500}>
          Parks
        </Text>

        <Text size="sm" color="dimmed">
          Park listings coming soon...
        </Text>
      </Stack>
    </Box>
  )
}
