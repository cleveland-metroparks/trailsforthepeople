import { Box, Stack, Text, UnstyledButton } from '@mantine/core'
import { ReactNode, useEffect, useRef } from 'react'

const HOVER_COLOR = '#F2F8E1'
const BORDER_COLOR = '#e0e0e0'

interface PanelListItemProps {
  children: ReactNode
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onFocus?: () => void
  onBlur?: () => void
  isFirst?: boolean
  isLast?: boolean
  ariaLabel?: string
  isActive?: boolean
  itemRef?: (node: HTMLButtonElement | null) => void
}

export function PanelListItem({
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  isFirst = false,
  isLast = false,
  ariaLabel,
  isActive = false,
  itemRef,
}: PanelListItemProps) {
  const commonStyles = {
    borderTop: isFirst ? 'none' : `1px solid ${BORDER_COLOR}`,
    borderBottom: isLast ? `1px solid ${BORDER_COLOR}` : 'none',
    marginLeft: -16,
    marginRight: -16,
  }

  if (onClick) {
    return (
      <UnstyledButton
        ref={itemRef}
        type="button"
        aria-label={ariaLabel}
        aria-current={isActive ? 'true' : undefined}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          ...commonStyles,
          cursor: 'pointer',
          display: 'block',
          width: '100%',
          textAlign: 'left',
          borderRadius: 0,
        }}
        sx={{
          '&:hover': {
            backgroundColor: HOVER_COLOR,
          },
          '&:focus-visible': {
            outline: '2px solid #6AB03E',
            outlineOffset: '-2px',
            backgroundColor: HOVER_COLOR,
          },
        }}
      >
        <Box px={16} py="sm">
          {children}
        </Box>
      </UnstyledButton>
    )
  }

  return (
    <Box
      style={{
        ...commonStyles,
        cursor: 'default',
      }}
      sx={{
        '&:hover': {
          backgroundColor: 'transparent',
        },
      }}
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
  onFocus?: (item: T, index: number) => void
  onBlur?: (item: T, index: number) => void
  getItemAriaLabel?: (item: T, index: number) => string
  activeItemKey?: string | number | null
  focusItemKey?: string | number | null
  onFocusItemApplied?: () => void
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
  onFocus,
  onBlur,
  getItemAriaLabel,
  activeItemKey = null,
  focusItemKey = null,
  onFocusItemApplied,
  countLabel,
  emptyMessage = 'No items found.',
}: PanelListProps<T>) {
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  useEffect(() => {
    if (focusItemKey === null || focusItemKey === undefined) return
    const key = String(focusItemKey)
    const element = itemRefs.current.get(key)
    if (element) {
      requestAnimationFrame(() => {
        element.focus()
        onFocusItemApplied?.()
      })
    }
  }, [focusItemKey, onFocusItemApplied])

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
      {items.map((item, index) => {
        const key = keyExtractor(item, index)
        const stringKey = String(key)
        return (
          <PanelListItem
            key={key}
            isFirst={index === 0}
            isLast={index === items.length - 1}
            onClick={onClick ? () => onClick(item, index) : undefined}
            onMouseEnter={onMouseEnter ? () => onMouseEnter(item, index) : undefined}
            onMouseLeave={onMouseLeave ? () => onMouseLeave(item, index) : undefined}
            onFocus={onFocus ? () => onFocus(item, index) : undefined}
            onBlur={onBlur ? () => onBlur(item, index) : undefined}
            ariaLabel={getItemAriaLabel ? getItemAriaLabel(item, index) : undefined}
            isActive={activeItemKey !== null && String(activeItemKey) === stringKey}
            itemRef={(node) => {
              if (node) {
                itemRefs.current.set(stringKey, node)
              } else {
                itemRefs.current.delete(stringKey)
              }
            }}
          >
            {renderItem(item, index)}
          </PanelListItem>
        )
      })}
    </Stack>
  )
}
