import { Text, UnstyledButton } from '@mantine/core'
import { Home } from 'tabler-icons-react'
import { useDarkMode } from '../hooks/useDarkMode'

const ICON_COLOR = '#6AB03E'

interface HomeButtonProps {
  onClick: () => void
}

export function HomeButton({ onClick }: HomeButtonProps) {
  const isDarkMode = useDarkMode()

  return (
    <UnstyledButton
      type="button"
      aria-label="Home"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        borderRadius: '4px',
      }}
      sx={{
        '&:hover': {
          opacity: 0.8,
        },
        '&:focus-visible': {
          outline: '2px solid #6AB03E',
          outlineOffset: '2px',
        },
      }}
    >
      <Home size={18} color={ICON_COLOR} />
      <Text
        size="sm"
        style={{
          color: isDarkMode ? '#FFFFFF' : '#000000',
          textDecoration: 'underline',
          textUnderlineOffset: '2px',
        }}
      >
        Home
      </Text>
    </UnstyledButton>
  )
}
