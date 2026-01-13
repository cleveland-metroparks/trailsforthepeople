import { Text, Box, Button, Stack } from '@mantine/core'
import { MapPin } from 'tabler-icons-react'

interface NearbyPanelProps {
  onClose: () => void
}

export function NearbyPanel({ onClose: _onClose }: NearbyPanelProps) {
  return (
    <Box p="md" pr="sm" style={{ position: 'relative' }}>
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
