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
      aria-label="Close panel"
      data-skip-auto-focus="true"
      data-panel-close-focus="true"
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
