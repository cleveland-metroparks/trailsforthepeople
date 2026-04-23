import { Box, Text } from '@mantine/core'

const HEADER_BG = '#222124'
const HEADER_TEXT = '#FFFFFF'

interface PanelHeaderProps {
  title: string
}

export function PanelHeader({ title }: PanelHeaderProps) {
  return (
    <Box
      px="md"
      py="sm"
      style={{
        backgroundColor: HEADER_BG,
        marginLeft: -16,
        marginRight: -16,
        marginTop: -16,
        marginBottom: 16,
      }}
    >
      <Text
        size="lg"
        weight={700}
        style={{
          color: HEADER_TEXT,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {title}
      </Text>
    </Box>
  )
}
