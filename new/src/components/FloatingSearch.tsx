import { TextInput, Box, Stack, Text, Group, ActionIcon, Tooltip } from '@mantine/core'
import { Search, X } from 'tabler-icons-react'
import { useState, useRef, useEffect, useMemo, useId } from 'react'
import { useSearch } from '../contexts/SearchContext'
import { useSidebar } from '../contexts/SidebarContext'
import { useURLState } from '../hooks/useURLState'
import { useActivitiesData } from '../hooks/useActivitiesData'
import { useParksData } from '../hooks/useParksData'
import { useTrailsData } from '../hooks/useTrailsData'
import { getResultTypeLabel } from '../lib/searchUtils'
import { MetadataBadge } from './MetadataBadge'

// Panel content width (matches Layout.tsx PANEL_WIDTH minus padding)
const PANEL_CONTENT_WIDTH = 288 // 320px panel - 32px padding

const searchToUrlType: Record<string, string> = {
  attraction: 'attraction',
  reservation: 'park',
  trail: 'trail',
}

export function FloatingSearch() {
  const { isSidebarCollapsed, navWidth, isMobile, activePanel, isSheetExpanded, onSearchSubmit } = useSidebar()
  const { searchTerm, setSearchTerm, submitSearch, selectFromSuggestion, autocompleteSuggestions } = useSearch()
  const { params, setParams } = useURLState()
  const { attractions } = useActivitiesData()
  const { data: parks } = useParksData()
  const { data: trails } = useTrailsData()

  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<HTMLDivElement>(null)
  const autocompleteListId = useId()

  // Park name lookup for suggestions
  const getParkName = useMemo(() => {
    const parksMap = new Map<number | string, string>()
    parks?.forEach((p) => parksMap.set(p.record_id, String(p.pagetitle)))
    return (type: string, gid: string | number): string | undefined => {
      if (type === 'attraction') {
        const att = attractions.find((a) => String(a.gis_id || a.record_id) === String(gid))
        const resId = (att as { reservation?: number | string } | undefined)?.reservation
        return resId ? parksMap.get(resId) : undefined
      }
      if (type === 'trail') {
        const trail = trails?.find((t) => String(t.id) === String(gid))
        return (trail as { res?: string } | undefined)?.res
      }
      return undefined
    }
  }, [attractions, parks, trails])

  // Position: nav width + padding to align with panel content
  const leftPosition = navWidth + 16

  // Width when floating (sidebar collapsed): wider, responsive
  const floatingWidth = `min(600px, calc(100vw - ${leftPosition + 40}px))`

  // Width when panel is open: match the panel content width
  const panelWidth = `${PANEL_CONTENT_WIDTH}px`

  // Use floating width when collapsed, panel width when open
  const inputWidth = isSidebarCollapsed ? floatingWidth : panelWidth

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [autocompleteSuggestions])

  // Close autocomplete when clicking outside (autocompleteRef wraps input + dropdown)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowAutocomplete(false)
      setSelectedIndex(-1)
    } else if (e.key === 'Tab') {
      setShowAutocomplete(false)
      setSelectedIndex(-1)
    } else if (showAutocomplete && autocompleteSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i < autocompleteSuggestions.length - 1 ? i + 1 : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i <= 0 ? autocompleteSuggestions.length - 1 : i - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (selectedIndex >= 0 && autocompleteSuggestions[selectedIndex]) {
          handleSuggestionClick(autocompleteSuggestions[selectedIndex])
        } else {
          setShowAutocomplete(false)
          submitSearch()
          onSearchSubmit()
        }
      }
    } else if (e.key === 'Enter') {
      setShowAutocomplete(false)
      submitSearch()
      onSearchSubmit()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchTerm(val)
    setShowAutocomplete(val.length >= 2)
  }

  const handleClear = () => {
    setSearchTerm('')
    setShowAutocomplete(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleSuggestionClick = (suggestion: (typeof autocompleteSuggestions)[0]) => {
    if (!suggestion.location) return
    selectFromSuggestion(suggestion)
    setSearchTerm(suggestion.title)
    setShowAutocomplete(false)
    setSelectedIndex(-1)
    const urlType = searchToUrlType[suggestion.type] || suggestion.type
    setParams(
      {
        type: urlType,
        gid: String(suggestion.gid),
        fromSearch: 'true',
      },
      false,
      true
    )
    onSearchSubmit()
  }

  if (isMobile && activePanel === 'search' && isSheetExpanded && params.fromSearch !== 'true') return null

  return (
    <Box
      ref={autocompleteRef}
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
      <Box style={{ position: 'relative' }}>
        <TextInput
          ref={inputRef}
          placeholder="Search parks, trails, attractions..."
          value={searchTerm}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={showAutocomplete && autocompleteSuggestions.length > 0}
          aria-controls={autocompleteListId}
          aria-activedescendant={
            selectedIndex >= 0 && autocompleteSuggestions[selectedIndex]
              ? `${autocompleteListId}-option-${autocompleteSuggestions[selectedIndex].id}`
              : undefined
          }
          autoComplete="off"
          onFocus={() => {
            if (searchTerm.length >= 2 && autocompleteSuggestions.length > 0) {
              setShowAutocomplete(true)
            }
          }}
          onBlur={() => {
            setShowAutocomplete(false)
            setSelectedIndex(-1)
          }}
          rightSection={
            <Group spacing={10} noWrap style={{ width: '100%', justifyContent: 'flex-end', paddingRight: 16 }}>
              {searchTerm && (
                <Tooltip label="Clear" withArrow>
                  <ActionIcon
                    size="sm"
                    variant="transparent"
                    aria-label="Clear search"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleClear}
                    sx={{ '&:focus-visible': { color: 'black' } }}
                  >
                    <X size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
              <Tooltip label="Search" withArrow>
                <ActionIcon
                  size="sm"
                  variant="transparent"
                  aria-label="Submit search"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setShowAutocomplete(false)
                    submitSearch()
                    onSearchSubmit()
                  }}
                  style={{ color: 'inherit' }}
                >
                  <Search size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          }
          rightSectionWidth={68}
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

        {/* Autocomplete dropdown */}
        {showAutocomplete && autocompleteSuggestions.length > 0 && (
          <Box
            id={autocompleteListId}
            role="listbox"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1001,
              backgroundColor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              marginTop: '4px',
              maxHeight: '300px',
              overflowY: 'auto',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <Stack spacing={0}>
              {autocompleteSuggestions.map((suggestion, idx) => (
                <Box
                  key={suggestion.id}
                  id={`${autocompleteListId}-option-${suggestion.id}`}
                  role="option"
                  aria-selected={selectedIndex === idx}
                  tabIndex={-1}
                  p="sm"
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                  sx={{
                    backgroundColor: selectedIndex === idx ? '#F2F8E1' : undefined,
                    '&:hover': {
                      backgroundColor: '#F2F8E1',
                    },
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                  }}
                  onMouseDown={(e) => {
                    // Keep focus on the input long enough for click to fire.
                    e.preventDefault()
                  }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <Text size="sm" weight={500}>
                    {suggestion.title}
                  </Text>
                  <Group spacing="xs" mt={4}>
                    {getParkName(suggestion.type, suggestion.gid) && (
                      <Text size="xs" color="dimmed">
                        {getParkName(suggestion.type, suggestion.gid)}
                      </Text>
                    )}
                    <MetadataBadge>
                      {getResultTypeLabel(suggestion.type)}
                    </MetadataBadge>
                  </Group>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  )
}
