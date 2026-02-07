import { Box, Stack, Text } from '@mantine/core'
import { ReactNode } from 'react'

const HOVER_COLOR = '#F2F8E1'
const BORDER_COLOR = '#e0e0e0'

interface PanelListItemProps {
  children: ReactNode
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  isFirst?: boolean
  isLast?: boolean
}

export function PanelListItem({
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isFirst = false,
  isLast = false,
}: PanelListItemProps) {
  return (
    <Box
      style={{
        borderTop: isFirst ? 'none' : `1px solid ${BORDER_COLOR}`,
        borderBottom: isLast ? `1px solid ${BORDER_COLOR}` : 'none',
        cursor: onClick ? 'pointer' : 'default',
        marginLeft: -16,
        marginRight: -16,
      }}
      sx={{
        '&:hover': {
          backgroundColor: onClick ? HOVER_COLOR : 'transparent',
        },
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Box px={16} py="sm">
        {children}
      </Box>
    </Box>
  )
}

interface PanelListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  keyExtractor: (item: T, index: number) => string | number
  onClick?: (item: T, index: number) => void
  onMouseEnter?: (item: T, index: number) => void
  onMouseLeave?: (item: T, index: number) => void
  countLabel?: { singular: string; plural: string }
  emptyMessage?: string
}

export function PanelList<T>({
  items,
  renderItem,
  keyExtractor,
  onClick,
  onMouseEnter,
  onMouseLeave,
  countLabel,
  emptyMessage = 'No items found.',
}: PanelListProps<T>) {
  if (items.length === 0) {
    return (
      <Text size="sm" color="dimmed">
        {emptyMessage}
      </Text>
    )
  }

  return (
    <Stack spacing={0}>
      {countLabel && (
        <Text size="sm" weight={500} color="dimmed">
          {items.length} {items.length === 1 ? countLabel.singular : countLabel.plural}
        </Text>
      )}
      {items.map((item, index) => (
        <PanelListItem
          key={keyExtractor(item, index)}
          isFirst={index === 0}
          isLast={index === items.length - 1}
          onClick={onClick ? () => onClick(item, index) : undefined}
          onMouseEnter={onMouseEnter ? () => onMouseEnter(item, index) : undefined}
          onMouseLeave={onMouseLeave ? () => onMouseLeave(item, index) : undefined}
        >
          {renderItem(item, index)}
        </PanelListItem>
      ))}
    </Stack>
  )
}
