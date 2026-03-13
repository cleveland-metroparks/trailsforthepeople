import { AppShell, Navbar } from '@mantine/core'
import { useState, useRef } from 'react'
import { Sidebar, SidebarRef } from './Sidebar'
import { NAV_WIDTH_EXPANDED, NAV_WIDTH_COLLAPSED, PANEL_WIDTH } from './sidebarConstants'
import { SearchProvider } from '../contexts/SearchContext'
import { SidebarProvider } from '../contexts/SidebarContext'
import { MapProvider } from '../contexts/MapContext'
import { MapHoverProvider } from '../contexts/MapHoverContext'
import { MapSelectionProvider } from '../contexts/MapSelectionContext'
import { DirectionsProvider } from '../contexts/DirectionsContext'
import { useIsMobile } from '../hooks/useIsMobile'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [hasActivePanel, setHasActivePanel] = useState(false)
  const [isNavExpanded, setIsNavExpanded] = useState(true)
  const [activePanel, setActivePanel] = useState<string | null>(null)
  const sidebarRef = useRef<SidebarRef>(null)
  const isMobile = useIsMobile()

  const handleSearchSubmit = () => {
    setHasActivePanel(true)
    sidebarRef.current?.activateSearchTab()
  }

  // Calculate navbar width based on nav expansion and panel state (desktop only)
  const navWidth = isMobile ? 0 : (isNavExpanded ? NAV_WIDTH_EXPANDED : NAV_WIDTH_COLLAPSED)
  const totalWidth = isMobile ? 0 : (hasActivePanel ? navWidth + PANEL_WIDTH : navWidth)
  const navbarWidth = { sm: totalWidth, lg: totalWidth }

  return (
    <MapProvider>
      <MapSelectionProvider>
        <MapHoverProvider>
          <SearchProvider>
            <DirectionsProvider>
              <SidebarProvider
                isSidebarCollapsed={isMobile ? true : !hasActivePanel}
                navWidth={navWidth}
                sidebarWidth={totalWidth}
                isMobile={isMobile}
                activePanel={activePanel}
                onSearchSubmit={handleSearchSubmit}
                onClosePanel={() => sidebarRef.current?.closePanel()}
              >
                {isMobile ? (
                  <AppShell
                    padding={0}
                    styles={(theme) => ({
                      main: {
                        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
                        padding: 0,
                        height: '100vh',
                        position: 'relative',
                      },
                      root: {
                        height: '100vh',
                      },
                    })}
                  >
                    {children}
                    <Sidebar
                      ref={sidebarRef}
                      onPanelStateChange={setHasActivePanel}
                      onNavExpandedChange={setIsNavExpanded}
                      onActivePanelChange={setActivePanel}
                    />
                  </AppShell>
                ) : (
                  <AppShell
                    padding={0}
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
                        padding: 0,
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
                )}
              </SidebarProvider>
            </DirectionsProvider>
          </SearchProvider>
        </MapHoverProvider>
      </MapSelectionProvider>
    </MapProvider>
  )
}
