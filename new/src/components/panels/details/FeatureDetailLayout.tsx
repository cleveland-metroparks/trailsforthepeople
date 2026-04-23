import { Box, Stack } from '@mantine/core'
import type { ReactNode } from 'react'
import { PanelHeader } from '../../PanelHeader'
import { useSidebar } from '../../../contexts/SidebarContext'

interface FeatureDetailLayoutProps {
  panelTitle?: string
  backButton: ReactNode
  children: ReactNode
}

export function FeatureDetailLayout({ panelTitle, backButton, children }: FeatureDetailLayoutProps) {
  const { isMobile } = useSidebar()
  return (
    <Box p="md" pr="sm" style={{ position: 'relative' }}>
      {panelTitle && !isMobile && <PanelHeader title={panelTitle} />}
      <Stack spacing="md">
        {backButton}
        {children}
      </Stack>
    </Box>
  )
}
