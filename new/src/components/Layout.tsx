import { AppShell, Navbar } from '@mantine/core'
import { useState, useRef } from 'react'
import { Sidebar, SidebarRef } from './Sidebar'
import { SearchProvider } from '../contexts/SearchContext'
import { SidebarProvider } from '../contexts/SidebarContext'
import { MapProvider } from '../contexts/MapContext'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [hasActivePanel, setHasActivePanel] = useState(true)
  const sidebarRef = useRef<SidebarRef>(null)

  const handleSearchSubmit = () => {
    setHasActivePanel(true)
    sidebarRef.current?.activateSearchTab()
  }

  const navbarWidth = hasActivePanel
    ? { sm: 300, lg: 400 }
    : { sm: 80, lg: 80 }

  return (
    <MapProvider>
      <SearchProvider>
        <SidebarProvider
          isSidebarCollapsed={!hasActivePanel}
          onSearchSubmit={handleSearchSubmit}
        >
        <AppShell
        padding={0} // Remove padding to allow map to fill full space
        navbar={
          <Navbar
            py={"xs"}
            pr={"xs"}
            pl={"none"}
            width={navbarWidth}
            styles={{
              root: {
                boxSizing: 'border-box',
                borderRight: hasActivePanel ? undefined : 'none',
                overflow: 'visible',
              },
            }}
          >
            <Sidebar ref={sidebarRef} onPanelStateChange={setHasActivePanel} />
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
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          backgroundColor: 'rgba(255, 252, 245, 0.75)',
          borderRadius: '18px',
          padding: '10px 14px',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      >
        <img
          src="/cleveland-metroparks-logo-horiz.png"
          alt="Cleveland Metroparks"
          style={{
            height: '40px',
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
          }}
        />
      </div>
    </AppShell>
    </SidebarProvider>
    </SearchProvider>
    </MapProvider>
  )
}
