import { Text, Box, Stack, Anchor, Title } from '@mantine/core'

interface InfoPanelProps {
  onClose: () => void
}

export function InfoPanel({ onClose: _onClose }: InfoPanelProps) {
  return (
    <Box p="md" pr="sm" style={{ position: 'relative' }}>
      <Stack spacing="md">
        <Title order={1} size="h3">
          Credits
        </Title>

        <Text size="sm">
          Parks and facilities data by:<br />
          <Anchor target="_blank" href="https://clevelandmetroparks.com/">
            Cleveland Metroparks
          </Anchor>
        </Text>

        <Text size="sm">
          Some base map data:<br />
          &copy; <Anchor target="_blank" href="http://www.openstreetmap.org/copyright">
            OpenStreetMap contributors
          </Anchor>
        </Text>

        <Text size="sm">
          Driving and transit directions courtesy of:<br />
          <Anchor target="_blank" href="http://www.bing.com/maps/">
            Bing Maps
          </Anchor>
        </Text>

        <Text size="sm">
          Map interface developed by:<br />
          <Anchor target="_blank" href="https://www.websubstrate.com/">
            Substrate Websoft
          </Anchor> and <Anchor target="_blank" href="http://www.greeninfo.org/">
            GreenInfo Network
          </Anchor>
        </Text>

        <Title order={4} size="h4">
          Disclaimer
        </Title>

        <Text size="sm" className="disclaimer">
          This information is for display purposes only. Cleveland Metroparks makes no warranties, expressed or implied, with respect to the accuracy of and the use of this map and mapping application for any specific purpose. Cleveland Metroparks expressly disclaims any liability that may result from the use of this map or mapping application. For more information, please contact: Tom Kraft, GIS Administrator, <Anchor href="mailto:tjk1@clevelandmetroparks.com">tjk1@clevelandmetroparks.com</Anchor>.
        </Text>
      </Stack>
    </Box>
  )
}
