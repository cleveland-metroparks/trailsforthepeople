import { Badge } from '@mantine/core'
import type { ReactNode } from 'react'

interface MetadataBadgeProps {
  children: ReactNode
}

export function MetadataBadge({ children }: MetadataBadgeProps) {
  return (
    <Badge
      size="xs"
      variant="light"
      styles={{
        root: {
          color: '#245C2E',
          backgroundColor: '#E6F4EA',
        },
      }}
    >
      {children}
    </Badge>
  )
}
