import { AppShell, Navbar } from '@mantine/core'
import { useState, useRef } from 'react'
import { Sidebar, SidebarRef } from './Sidebar'
import { NAV_WIDTH_EXPANDED, NAV_WIDTH_COLLAPSED } from './sidebarConstants'
import { SearchProvider } from '../contexts/SearchContext'
import { SidebarProvider } from '../contexts/SidebarContext'
import { MapProvider } from '../contexts/MapContext'
import { MapHoverProvider } from '../contexts/MapHoverContext'
import { MapSelectionProvider } from '../contexts/MapSelectionContext'
import { DirectionsProvider } from '../contexts/DirectionsContext'

// Panel width when content is shown
const PANEL_WIDTH = 320

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [hasActivePanel, setHasActivePanel] = useState(false)
  const [isNavExpanded, setIsNavExpanded] = useState(true)
  const sidebarRef = useRef<SidebarRef>(null)

  const handleSearchSubmit = () => {
    setHasActivePanel(true)
    sidebarRef.current?.activateSearchTab()
  }

  // Calculate navbar width based on nav expansion and panel state
  const navWidth = isNavExpanded ? NAV_WIDTH_EXPANDED : NAV_WIDTH_COLLAPSED
  const totalWidth = hasActivePanel ? navWidth + PANEL_WIDTH : navWidth
  const navbarWidth = { sm: totalWidth, lg: totalWidth }

  return (
    <MapProvider>
      <MapSelectionProvider>
        <MapHoverProvider>
          <SearchProvider>
            <DirectionsProvider>
            <SidebarProvider
              isSidebarCollapsed={!hasActivePanel}
              navWidth={navWidth}
              onSearchSubmit={handleSearchSubmit}
            >
        <AppShell
        padding={0} // Remove padding to allow map to fill full space
        navbar={
          <Navbar
            p={0}
            width={navbarWidth}
            styles={{
              root: {
                boxSizing: 'border-box',
                borderRight: 'none',
                overflow: 'visible',
                backgroundColor: 'transparent',
              },
            }}
          >
            <Sidebar
              ref={sidebarRef}
              onPanelStateChange={setHasActivePanel}
              onNavExpandedChange={setIsNavExpanded}
            />
          </Navbar>
        }
      styles={(theme) => ({
        main: {
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
          padding: 0, // Ensure no padding in main area
          height: '100vh',
          position: 'relative',
        },
        root: {
          height: '100vh',
        },
      })}
    >
      {children}
    </AppShell>
            </SidebarProvider>
            </DirectionsProvider>
          </SearchProvider>
        </MapHoverProvider>
      </MapSelectionProvider>
    </MapProvider>
  )
}
