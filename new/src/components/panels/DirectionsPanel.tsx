import { Text, Box, Stack, ActionIcon } from '@mantine/core'
import { X } from 'tabler-icons-react'

interface DirectionsPanelProps {
  onClose: () => void
}

export function DirectionsPanel({ onClose }: DirectionsPanelProps) {
  return (
    <Box p="md" style={{ position: 'relative' }}>
      <ActionIcon
        style={{ position: 'absolute', top: 16, right: 16 }}
        onClick={onClose}
        variant="subtle"
        color="gray"
      >
        <X size={18} />
      </ActionIcon>
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
