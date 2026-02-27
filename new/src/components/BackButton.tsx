import { Text, UnstyledButton } from '@mantine/core'
import { CornerUpLeft } from 'tabler-icons-react'

const ICON_COLOR = '#6AB03E'

interface BackButtonProps {
  onClick: () => void
  autoFocus?: boolean
}

export function BackButton({ onClick, autoFocus = false }: BackButtonProps) {
  return (
    <UnstyledButton
      type="button"
      autoFocus={autoFocus}
      data-primary-focus="true"
      aria-label="Back"
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
    </UnstyledButton>
  )
}
