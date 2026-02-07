import { TextInput, Box } from '@mantine/core'
import { Search } from 'tabler-icons-react'
import { useSearch } from '../contexts/SearchContext'
import { useSidebar } from '../contexts/SidebarContext'

// Panel content width (matches Layout.tsx PANEL_WIDTH minus padding)
const PANEL_CONTENT_WIDTH = 288 // 320px panel - 32px padding

export function FloatingSearch() {
  const { isSidebarCollapsed, navWidth, onSearchSubmit } = useSidebar()
  const { searchTerm, setSearchTerm, submitSearch } = useSearch()

  // Position: nav width + padding to align with panel content
  const leftPosition = navWidth + 16

  // Width when floating (sidebar collapsed): wider, responsive
  const floatingWidth = `min(600px, calc(100vw - ${leftPosition + 40}px))`

  // Width when panel is open: match the panel content width
  const panelWidth = `${PANEL_CONTENT_WIDTH}px`

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
        top: '16px', // Match SearchPanel's p="md" (16px) padding
        left: `${leftPosition}px`,
        zIndex: 1000,
        width: inputWidth,
        opacity: isSidebarCollapsed ? 1 : 0,
        pointerEvents: isSidebarCollapsed ? 'auto' : 'none',
        transition: 'left 200ms ease, width 200ms ease, opacity 150ms ease',
      }}
    >
      <TextInput
        placeholder="Search parks, trails, attractions..."
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
