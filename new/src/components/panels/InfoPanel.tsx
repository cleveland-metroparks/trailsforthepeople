import { Text, Box, Stack, Anchor } from '@mantine/core'

interface InfoPanelProps {
  onClose: () => void
}

export function InfoPanel({ onClose: _onClose }: InfoPanelProps) {
  return (
    <Box p="md" style={{ position: 'relative' }}>
      <Stack spacing="md">
        <Text size="lg" weight={500}>
          About Cleveland Metroparks
        </Text>

        <Text size="sm">
          Plan your visit at any of Cleveland Metroparks' 18 park reservations
          spanning over 23,000 acres!
        </Text>

        <Anchor href="https://www.clevelandmetroparks.com/" target="_blank">
          Visit Cleveland Metroparks
        </Anchor>

        <Text size="sm" color="dimmed">
          More information coming soon...
        </Text>
      </Stack>
    </Box>
  )
}
