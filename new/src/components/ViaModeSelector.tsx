import { Box, ActionIcon, Tooltip } from '@mantine/core'
import { Walk, Bike, Car, Bus } from 'tabler-icons-react'
import type { ViaMode } from '../contexts/DirectionsContext'

const ICON_SIZE = 28
const ICON_COLOR = '#373535'

export const VIA_MODES = [
  { via: 'hike' as const, icon: Walk, label: 'Walking' },
  { via: 'bike' as const, icon: Bike, label: 'Bicycling' },
  { via: 'car' as const, icon: Car, label: 'Driving' },
  { via: 'bus' as const, icon: Bus, label: 'Transit' },
] as const

interface ViaModeSelectorProps {
  value: ViaMode
  onChange: (via: ViaMode) => void
  /** 'compact' = outline buttons for detail panes; 'full' = filled active state for directions form */
  variant?: 'compact' | 'full'
}

export function ViaModeSelector({ value, onChange, variant = 'full' }: ViaModeSelectorProps) {
  return (
    <Box style={{ display: 'flex', gap: variant === 'compact' ? '8px' : '6px' }}>
      {VIA_MODES.map(({ via, icon: Icon, label }) => {
        const isActive = value === via
        const showActiveState = variant === 'full' && isActive

        return (
          <Tooltip key={via} label={label} withArrow>
            <ActionIcon
              size={44}
              variant={showActiveState ? 'filled' : 'outline'}
              radius="sm"
              onClick={() => onChange(via)}
              sx={{
                backgroundColor: showActiveState ? ICON_COLOR : undefined,
                borderColor: showActiveState ? ICON_COLOR : '#ddd',
                '&:hover': {
                  backgroundColor: showActiveState ? '#5a9a34' : '#f0f9e8',
                  borderColor: ICON_COLOR,
                },
              }}
            >
              <Icon size={ICON_SIZE} color={showActiveState ? '#fff' : ICON_COLOR} />
            </ActionIcon>
          </Tooltip>
        )
      })}
    </Box>
  )
}
