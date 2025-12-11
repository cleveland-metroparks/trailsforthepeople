import { Text, Box, Stack, Anchor, ActionIcon } from '@mantine/core'
import { X } from 'tabler-icons-react'

interface InfoPanelProps {
  onClose: () => void
}

export function InfoPanel({ onClose }: InfoPanelProps) {
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
