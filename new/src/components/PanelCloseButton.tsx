import { ActionIcon } from '@mantine/core'
import { X } from 'tabler-icons-react'

interface PanelCloseButtonProps {
  onClick: () => void
  variant?: 'light' | 'dark'
}

export function PanelCloseButton({ onClick, variant = 'light' }: PanelCloseButtonProps) {
  const color = variant === 'light' ? '#FFFFFF' : '#666666'

  return (
    <ActionIcon
      onClick={onClick}
      size="sm"
      variant="transparent"
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 1000,
        cursor: 'pointer',
        color,
      }}
    >
      <X size={18} />
    </ActionIcon>
  )
}
