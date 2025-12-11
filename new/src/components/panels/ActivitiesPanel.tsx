import { Text, Box, Stack } from '@mantine/core'

interface ActivitiesPanelProps {
  onClose: () => void
}

export function ActivitiesPanel({ onClose }: ActivitiesPanelProps) {
  return (
    <Box p="md" style={{ position: 'relative' }}>
      <Stack spacing="md">
        <Text size="lg" weight={500}>
          Activities
        </Text>

        <Text size="sm" color="dimmed">
          Activity listings coming soon...
        </Text>
      </Stack>
    </Box>
  )
}
