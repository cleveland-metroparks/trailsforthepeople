import { TextInput, Box, useMantineTheme } from '@mantine/core'
import { Search } from 'tabler-icons-react'
import { useSearch } from '../contexts/SearchContext'
import { useSidebar } from '../contexts/SidebarContext'
import { useMediaQuery } from '@mantine/hooks'

export function FloatingSearch() {
  const { isSidebarCollapsed, onSearchSubmit } = useSidebar()
  const { searchTerm, setSearchTerm, submitSearch } = useSearch()
  const theme = useMantineTheme()
  const isLargeScreen = useMediaQuery(`(min-width: ${theme.breakpoints.lg}px)`)

  // Panel width: 300px (sm) or 400px (lg), minus 32px for padding (16px each side)
  const panelWidth = isLargeScreen ? '368px' : '268px'

  // Floating width: viewport-based, max 600px
  const floatingWidth = 'min(600px, calc(100vw - 200px))'

  // Use floating width when collapsed, panel width when open
  const inputWidth = isSidebarCollapsed ? floatingWidth : panelWidth

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submitSearch()
      onSearchSubmit()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  return (
    <Box
      style={{
        position: 'absolute',
        top: '26px', // 16px (Box padding) - title and spacing removed
        left: '106px', // 80px (tabs) + 16px (Box padding)
        zIndex: 1000,
        width: inputWidth,
        opacity: isSidebarCollapsed ? 1 : 0,
        pointerEvents: isSidebarCollapsed ? 'auto' : 'none',
        transition: 'width 200ms ease-in-out, opacity 150ms ease-in-out',
      }}
    >
      <TextInput
        placeholder="Search for parks, trails, or activities..."
        value={searchTerm}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        rightSection={<Search size={16} />}
        size="lg"
        styles={{
          input: {
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e0e0e0',
            height: '48px',
          },
        }}
      />
    </Box>
  )
}
