import { Box, Stack } from '@mantine/core'
import type { ReactNode } from 'react'
import { PanelHeader } from '../../PanelHeader'

interface FeatureDetailLayoutProps {
  panelTitle?: string
  backButton: ReactNode
  children: ReactNode
}

export function FeatureDetailLayout({ panelTitle, backButton, children }: FeatureDetailLayoutProps) {
  return (
    <Box p="md" pr="sm" style={{ position: 'relative' }}>
      {panelTitle && <PanelHeader title={panelTitle} />}
      <Stack spacing="md">
        {backButton}
        {children}
      </Stack>
    </Box>
  )
}
