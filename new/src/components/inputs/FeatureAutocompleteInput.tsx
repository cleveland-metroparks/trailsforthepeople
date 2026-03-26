import { Box, Text, TextInput, Stack, Group } from '@mantine/core'
import { useState, useRef, useEffect, useMemo, useId } from 'react'
import { useSearchIndex } from '../../hooks/useSearchIndex'
import { useActivitiesData } from '../../hooks/useActivitiesData'
import { useParksData } from '../../hooks/useParksData'
import { useTrailsData } from '../../hooks/useTrailsData'
import { getResultTypeLabel } from '../../lib/searchUtils'
import { MetadataBadge } from '../MetadataBadge'
import { useDarkMode } from '../../hooks/useDarkMode'

export interface FeatureAutocompleteSuggestion {
  text: string
  lat: number
  lng: number
  reservationId?: string | number
}

interface FeatureAutocompleteInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: FeatureAutocompleteSuggestion) => void
  placeholder?: string
  rightSection?: React.ReactNode
  inputId?: string
  isPrimaryFocusTarget?: boolean
}

export function FeatureAutocompleteInput({
  label,
  value,
  onChange,
  onSelect,
  placeholder = 'Address, place, or coordinates',
  rightSection,
  inputId,
  isPrimaryFocusTarget = false,
}: FeatureAutocompleteInputProps) {
  const isDarkMode = useDarkMode()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<Array<{ id: string; title: string; type: string; parkName?: string; reservationId?: string | number; lat?: number; lng?: number }>>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownId = useId()

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

  // Reservation ID lookup for routing decisions
  const getReservationId = useMemo(() => {
    const parksMap = new Map<number | string, string | number>()
    parks?.forEach((p) => parksMap.set(p.record_id, p.record_id))
    const parksPagetitleMap = new Map<string, string | number>()
    parks?.forEach((p) => parksPagetitleMap.set(String(p.pagetitle), p.record_id))
    return (type: string, gid: string | number): string | number | undefined => {
      if (type === 'park') {
        return parksMap.get(gid)
      }
      if (type === 'attraction') {
        const att = attractions.find((a) => String(a.gis_id || a.record_id) === String(gid))
        const resId = (att as { reservation?: number | string } | undefined)?.reservation
        return resId != null ? resId : undefined
      }
      if (type === 'trail') {
        const trail = trails?.find((t) => String(t.id) === String(gid))
        const res = (trail as { res?: string } | undefined)?.res
        return res ? parksPagetitleMap.get(res) : undefined
      }
      return undefined
    }
  }, [attractions, parks, trails])

  // Keep refs to latest autocomplete/getParkName to avoid re-triggering the
  // debounce effect when only these function references change.
  const autocompleteRef = useRef(autocomplete)
  const getParkNameRef = useRef(getParkName)
  const getReservationIdRef = useRef(getReservationId)
  useEffect(() => {
    autocompleteRef.current = autocomplete
    getParkNameRef.current = getParkName
    getReservationIdRef.current = getReservationId
  }, [autocomplete, getParkName, getReservationId])

  // Update suggestions when value changes (debounced)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!value.trim() || value.length < 2 || !isReady) {
      setSuggestions((prev) => (prev.length === 0 ? prev : []))
      return
    }

    debounceRef.current = setTimeout(() => {
      const results = autocompleteRef.current(value, 8)
      setSuggestions(
        results
          .filter((r) => {
            const valid = r.lat != null && r.lng != null && !isNaN(r.lat) && !isNaN(r.lng) && (r.lat !== 0 || r.lng !== 0)
            if (!valid) {
              console.log(`[missing coords] autocomplete filtered ${r.type} id=${r.gid} "${r.title}" lat=${r.lat} lng=${r.lng}`)
            }
            return valid
          })
          .map((r) => ({
            id: r.id,
            title: r.title,
            type: r.type,
            parkName: getParkNameRef.current(r.type, r.gid),
            reservationId: getReservationIdRef.current(r.type, r.gid),
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
  }, [value, isReady])

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
      onSelect({ text: s.title, lat: s.lat, lng: s.lng, reservationId: s.reservationId })
      setShowSuggestions(false)
      setSuggestions([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    } else if (e.key === 'Tab') {
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
        id={inputId}
        ref={inputRef}
        data-primary-focus={isPrimaryFocusTarget ? 'true' : undefined}
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (value.length >= 2 && suggestions.length > 0) {
            setShowSuggestions(true)
          }
        }}
        onBlur={() => {
          setShowSuggestions(false)
          setSelectedIndex(-1)
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={shouldShowDropdown}
        aria-controls={dropdownId}
        aria-activedescendant={
          selectedIndex >= 0 && suggestions[selectedIndex]
            ? `${dropdownId}-option-${suggestions[selectedIndex].id}`
            : undefined
        }
        autoComplete="off"
        rightSection={rightSection}
        styles={{ label: { minHeight: 22 } }}
      />

      {shouldShowDropdown && (
        <Box
          ref={dropdownRef}
          id={dropdownId}
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: isDarkMode ? '#2c2c2c' : 'white',
            border: isDarkMode ? '1px solid #555' : '1px solid #e0e0e0',
            borderRadius: '4px',
            marginTop: '4px',
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Stack spacing={0}>
            {suggestions.map((s, idx) => (
              <Box
                key={s.id}
                id={`${dropdownId}-option-${s.id}`}
                role="option"
                aria-selected={selectedIndex === idx}
                tabIndex={-1}
                p="sm"
                style={{
                  cursor: 'pointer',
                  borderBottom: isDarkMode ? '1px solid #444' : '1px solid #f0f0f0',
                }}
                sx={{
                  backgroundColor: selectedIndex === idx
                    ? (isDarkMode ? 'rgba(106, 176, 62, 0.2)' : '#F2F8E1')
                    : undefined,
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(106, 176, 62, 0.2)' : '#F2F8E1',
                  },
                  '&:last-child': {
                    borderBottom: 'none',
                  },
                }}
                onMouseDown={(e) => {
                  // Keep focus on the input long enough for click to fire.
                  e.preventDefault()
                }}
                onClick={() => handleSuggestionClick(s)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <Text size="sm" weight={500} color={isDarkMode ? 'white' : undefined}>
                  {s.title}
                </Text>
                <Group spacing="xs" mt={4}>
                  {s.parkName && (
                    <Text size="xs" color={isDarkMode ? 'rgba(255,255,255,0.6)' : 'dimmed'}>
                      {s.parkName}
                    </Text>
                  )}
                  <MetadataBadge>
                    {getResultTypeLabel(s.type)}
                  </MetadataBadge>
                </Group>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  )
}
