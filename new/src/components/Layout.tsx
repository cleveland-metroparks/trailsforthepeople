import { AppShell, Header, Navbar, MediaQuery, Burger, useMantineTheme } from '@mantine/core'
import { useState } from 'react'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const theme = useMantineTheme()
  const [opened, setOpened] = useState(false)
  const [hasActivePanel, setHasActivePanel] = useState(true)

  const navbarWidth = hasActivePanel
    ? { sm: 300, lg: 400 }
    : { sm: 90, lg: 90 }

  return (
    <AppShell
      padding={0} // Remove padding to allow map to fill full space
      navbar={
        <Navbar
          p={"xs"}
          hiddenBreakpoint="sm"
          hidden={!opened}
          width={navbarWidth}
          styles={{
            root: {
              boxSizing: 'border-box',
              borderRight: hasActivePanel ? undefined : 'none',
            },
          }}
        >
          <Sidebar onPanelStateChange={setHasActivePanel} />
        </Navbar>
      }
      header={
        <Header height={70} p="md">
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
              <Burger
                opened={opened}
                onClick={() => setOpened((o) => !o)}
                size="sm"
                color={theme.colors.gray[6]}
                mr="xl"
              />
            </MediaQuery>

            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
                Cleveland Metroparks Map
              </h1>
            </div>
          </div>
        </Header>
      }
      styles={(theme) => ({
        main: {
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
          padding: 0, // Ensure no padding in main area
          height: 'calc(100vh - 70px)', // Account for header height
        },
        root: {
          height: '100vh',
        },
      })}
    >
      {children}
    </AppShell>
  )
}
