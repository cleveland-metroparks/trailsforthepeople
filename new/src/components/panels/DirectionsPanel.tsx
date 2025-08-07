import { Text, Box, Stack } from '@mantine/core'

export function DirectionsPanel() {
  return (
    <Box p="md">
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
