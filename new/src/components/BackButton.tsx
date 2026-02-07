import { Box, Text } from '@mantine/core'
import { CornerUpLeft } from 'tabler-icons-react'

const ICON_COLOR = '#6AB03E'

interface BackButtonProps {
  onClick: () => void
}

export function BackButton({ onClick }: BackButtonProps) {
  return (
    <Box
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
      }}
      sx={{
        '&:hover': {
          opacity: 0.8,
        },
      }}
    >
      <CornerUpLeft size={18} color={ICON_COLOR} />
      <Text
        size="sm"
        style={{
          color: '#000000',
          textDecoration: 'underline',
          textUnderlineOffset: '2px',
        }}
      >
        Back
      </Text>
    </Box>
  )
}
