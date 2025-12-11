import { Text, Box, Button, Stack, ActionIcon } from '@mantine/core'
import { MapPin, X } from 'tabler-icons-react'

interface NearbyPanelProps {
  onClose: () => void
}

export function NearbyPanel({ onClose }: NearbyPanelProps) {
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
          Nearby Places
        </Text>

        <Button leftIcon={<MapPin size={16} />} variant="outline" fullWidth>
          Find My Location
        </Button>

        <Text size="sm" color="dimmed">
          Nearby functionality coming soon...
        </Text>
      </Stack>
    </Box>
  )
}
