import { Box, Text, TextInput, Badge, Stack, Group } from '@mantine/core'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useSearchIndex } from '../../hooks/useSearchIndex'
import { useActivitiesData } from '../../hooks/useActivitiesData'
import { useParksData } from '../../hooks/useParksData'
import { useTrailsData } from '../../hooks/useTrailsData'
import { getResultTypeLabel } from '../../lib/searchUtils'

const DROPDOWN_STYLES = {
  position: 'absolute' as const,
  top: '100%',
  left: 0,
  right: 0,
  zIndex: 1000,
  backgroundColor: 'white',
  border: '1px solid #e0e0e0',
  borderRadius: '4px',
  marginTop: '4px',
  maxHeight: '300px',
  overflowY: 'auto' as const,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
}

export interface FeatureAutocompleteSuggestion {
  text: string
  lat: number
  lng: number
}

interface FeatureAutocompleteInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: FeatureAutocompleteSuggestion) => void
  placeholder?: string
  rightSection?: React.ReactNode
}

export function FeatureAutocompleteInput({
  label,
  value,
  onChange,
  onSelect,
  placeholder = 'Address, place, or coordinates',
  rightSection,
}: FeatureAutocompleteInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<Array<{ id: string; title: string; type: string; parkName?: string; lat?: number; lng?: number }>>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { autocomplete, isReady } = useSearchIndex()
  const { attractions } = useActivitiesData()
  const { data: parks } = useParksData()
  const { data: trails } = useTrailsData()

  // Park name lookup for attractions and trails
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

  // Update suggestions when value changes (debounced)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!value.trim() || value.length < 2 || !isReady) {
      setSuggestions([])
      return
    }

    debounceRef.current = setTimeout(() => {
      const results = autocomplete(value, 8)
      setSuggestions(
        results
          .filter((r) => r.lat != null && r.lng != null)
          .map((r) => ({
            id: r.id,
            title: r.title,
            type: r.type,
            parkName: getParkName(r.type, r.gid),
            lat: r.lat,
            lng: r.lng,
          }))
      )
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [value, isReady, autocomplete, getParkName])

  // Show dropdown when we have suggestions and user has typed enough
  const shouldShowDropdown = showSuggestions && suggestions.length > 0 && value.length >= 2

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [suggestions])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.currentTarget.value
    onChange(val)
    setShowSuggestions(val.length >= 2)
  }

  const handleSuggestionClick = (s: (typeof suggestions)[0]) => {
    if (s.lat != null && s.lng != null) {
      onSelect({ text: s.title, lat: s.lat, lng: s.lng })
      setShowSuggestions(false)
      setSuggestions([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    } else if (shouldShowDropdown && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
      } else if (e.key === 'Enter' && selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault()
        handleSuggestionClick(suggestions[selectedIndex])
      }
    }
  }

  return (
    <Box style={{ position: 'relative' }}>
      <TextInput
        ref={inputRef}
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (value.length >= 2 && suggestions.length > 0) {
            setShowSuggestions(true)
          }
        }}
        onKeyDown={handleKeyDown}
        rightSection={rightSection}
      />

      {shouldShowDropdown && (
        <Box ref={dropdownRef} style={DROPDOWN_STYLES}>
          <Stack spacing={0}>
            {suggestions.map((s, idx) => (
              <Box
                key={s.id}
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
                onClick={() => handleSuggestionClick(s)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <Text size="sm" weight={500}>
                  {s.title}
                </Text>
                <Group spacing="xs" mt={4}>
                  {s.parkName && (
                    <Text size="xs" color="dimmed">
                      {s.parkName}
                    </Text>
                  )}
                  <Badge size="xs" variant="light">
                    {getResultTypeLabel(s.type)}
                  </Badge>
                </Group>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  )
}
