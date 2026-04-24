import { Box, ActionIcon, Tooltip } from '@mantine/core'
import { Walk, Bike, Car, Bus } from 'tabler-icons-react'
import type { ViaMode } from '../contexts/DirectionsContext'
import { featureFlags } from '../lib/featureFlags'
import { useDarkMode } from '../hooks/useDarkMode'

const ICON_SIZE = 28
const ICON_COLOR_LIGHT = '#373535'

const ALL_VIA_MODES = [
  { via: 'hike' as const, icon: Walk, label: 'Walking' },
  { via: 'bike' as const, icon: Bike, label: 'Bicycling' },
  { via: 'car' as const, icon: Car, label: 'Driving' },
  { via: 'bus' as const, icon: Bus, label: 'Transit' },
] as const

type ViaModeEntry = typeof ALL_VIA_MODES[number]

const VIA_MODES: readonly ViaModeEntry[] = featureFlags.transitDirections
  ? ALL_VIA_MODES
  : ALL_VIA_MODES.filter((m) => m.via !== 'bus')

interface ViaModeSelectorProps {
  value: ViaMode
  onChange: (via: ViaMode) => void
  /** 'compact' = outline buttons for detail panes; 'full' = filled active state for directions form */
  variant?: 'compact' | 'full'
}

export function ViaModeSelector({ value, onChange, variant = 'full' }: ViaModeSelectorProps) {
  const isDarkMode = useDarkMode()
  const iconColor = isDarkMode ? '#ffffff' : ICON_COLOR_LIGHT
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.3)' : '#ddd'
  const hoverBg = isDarkMode ? 'rgba(106, 176, 62, 0.15)' : '#f0f9e8'

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
                backgroundColor: showActiveState ? ICON_COLOR_LIGHT : undefined,
                borderColor: showActiveState ? ICON_COLOR_LIGHT : borderColor,
                '&:hover': {
                  backgroundColor: showActiveState ? '#5a9a34' : hoverBg,
                  borderColor: ICON_COLOR_LIGHT,
                },
              }}
            >
              <Icon size={ICON_SIZE} color={showActiveState ? '#fff' : iconColor} />
            </ActionIcon>
          </Tooltip>
        )
      })}
    </Box>
  )
}
