import { TextInput, Button, Stack, Text, Box, Loader, Badge, Alert, Group } from '@mantine/core'
import { PanelList } from '../PanelList'
import { PanelHeader } from '../PanelHeader'
import { Search } from 'tabler-icons-react'
import { useSearch } from '../../contexts/SearchContext'
import { useMap } from '../../contexts/MapContext'
import { useURLState } from '../../hooks/useURLState'
import { useSidebarAwarePadding } from '../../hooks/useSidebarAwarePadding'
import { zoomToFeature } from '../../lib/mapUtils'
import { getResultTypeLabel } from '../../lib/searchUtils'
import { useActivitiesData } from '../../hooks/useActivitiesData'
import { useParksData } from '../../hooks/useParksData'
import { useTrailsData } from '../../hooks/useTrailsData'
import { useCategoriesData } from '../../hooks/useCategoriesData'
import { highlightTrailLine, clearTrailHighlight, highlightParkBoundary, fadeOutParkHighlight, getBoundingBoxFromGeometry, placeAttractionMarker, clearAttractionMarker } from '../../lib/mapUtils'
import { useReservationBoundaries } from '../../hooks/useReservationBoundaries'
import { getTrailGeometry } from '../../lib/api'
import type { Reservation, TransformedAttraction, TransformedTrail } from '../../types/api'
import mapboxgl from 'mapbox-gl'
import { useState, useRef, useEffect, useMemo } from 'react'
import { AttractionDetailPane } from './details/AttractionDetailPane'
import { ParkDetailPane } from './details/ParkDetailPane'
import { TrailDetailPane } from './details/TrailDetailPane'

interface SearchPanelProps {
  onClose: () => void
}

const urlToSearchType: Record<string, string> = {
  attraction: 'attraction',
  park: 'reservation',
  trail: 'trail',
}
const searchToUrlType: Record<string, string> = {
  attraction: 'attraction',
  reservation: 'park',
  trail: 'trail',
}

export function SearchPanel(_props: SearchPanelProps) {
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    autocompleteSuggestions,
    isLoading,
    isGeocoding,
    error,
    coordinates,
    submitSearch,
    selectFromSuggestion,
  } = useSearch()

  const { map } = useMap()
  const { params, setParams } = useURLState()
  const sidebarAwarePadding = useSidebarAwarePadding(120)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<HTMLDivElement>(null)

  // Fetch full feature data
  const { attractions, activities, isLoading: activitiesLoading } = useActivitiesData()
  const { data: parks, isLoading: parksLoading } = useParksData()
  const { data: trails, isLoading: trailsLoading } = useTrailsData()
  const { categoriesMap } = useCategoriesData()
  const { data: boundaries } = useReservationBoundaries()

  // Check if any required data is still loading
  const isDataLoading = activitiesLoading || parksLoading || trailsLoading

  // SINGLE SOURCE OF TRUTH: Derive selectedSearchResult from URL params when fromSearch=true
  // This matches the pattern used in other panels and prevents flashing
  const selectedSearchResult = useMemo(() => {
    if (params.fromSearch !== 'true' || !params.type || !params.gid) {
      return null
    }
    const expectedType = urlToSearchType[params.type] || params.type
    return searchResults.find(
      (r) => r.type === expectedType && String(r.gid) === params.gid
    ) || null
  }, [params.fromSearch, params.type, params.gid, searchResults])

  // Track zoom state
  const shouldZoomRef = useRef(false)
  const zoomedFeatureIdRef = useRef<string | null>(null)
  const currentTrailRef = useRef<number | null>(null)

  // Find full feature data based on selected search result
  const selectedFeature = useMemo(() => {
    if (!selectedSearchResult) return null

    if (selectedSearchResult.type === 'attraction') {
      return attractions.find(
        (a) => String(a.gis_id || a.record_id) === String(selectedSearchResult.gid)
      ) || null
    }

    if (selectedSearchResult.type === 'reservation') {
      return parks?.find((p) => String(p.record_id) === String(selectedSearchResult.gid)) || null
    }

    if (selectedSearchResult.type === 'trail') {
      return trails?.find((t) => String(t.id) === String(selectedSearchResult.gid)) || null
    }

    return null
  }, [selectedSearchResult, attractions, parks, trails])

  // Park name lookup for search results (attractions and trails)
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

  // Create boundaries map for parks
  const boundariesByParkName = useMemo(() => {
    if (!boundaries) return new Map<string, GeoJSON.Polygon | GeoJSON.MultiPolygon>()

    const boundaryMap = new Map<string, GeoJSON.Polygon | GeoJSON.MultiPolygon>()
    boundaries.forEach((boundary) => {
      try {
        const geometry = JSON.parse(boundary.geom_geojson) as GeoJSON.Polygon | GeoJSON.MultiPolygon
        boundaryMap.set(boundary.res, geometry)
      } catch (e) {
        console.error('Failed to parse geometry for', boundary.res, e)
      }
    })
    return boundaryMap
  }, [boundaries])

  // Handle zoom and highlighting for selected feature
  useEffect(() => {
    if (!selectedFeature || !map || !selectedSearchResult) return

    const featureId = String(selectedSearchResult.gid)
    const alreadyZoomed = featureId === zoomedFeatureIdRef.current
    // Check if this is initial load (no feature zoomed yet) or user clicked
    const isInitialLoad = zoomedFeatureIdRef.current === null

    // Zoom if: user clicked OR initial load with feature in URL
    if ((shouldZoomRef.current || isInitialLoad) && !alreadyZoomed) {
      if (selectedSearchResult.type === 'attraction') {
        const attraction = selectedFeature as TransformedAttraction
        const lat = typeof attraction.latitude === 'number' ? attraction.latitude : Number(attraction.latitude)
        const lng = typeof attraction.longitude === 'number' ? attraction.longitude : Number(attraction.longitude)
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          zoomToFeature(map, { lat, lng }, { padding: sidebarAwarePadding })
        }
      } else if (selectedSearchResult.type === 'reservation' && parks) {
        const park = selectedFeature as Reservation
        const parkGeometry = boundariesByParkName.get(park.pagetitle)
        if (parkGeometry) {
          const boundingBox = getBoundingBoxFromGeometry(parkGeometry)
          if (boundingBox) {
            zoomToFeature(map, boundingBox, { padding: sidebarAwarePadding })
            highlightParkBoundary(map, parkGeometry)
            fadeOutParkHighlight(map, 1000, 2000)
          }
        } else if (park.boxw && park.boxs && park.boxe && park.boxn) {
          const w = typeof park.boxw === 'number' ? park.boxw : Number(park.boxw)
          const s = typeof park.boxs === 'number' ? park.boxs : Number(park.boxs)
          const e = typeof park.boxe === 'number' ? park.boxe : Number(park.boxe)
          const n = typeof park.boxn === 'number' ? park.boxn : Number(park.boxn)
          if (w && s && e && n && !isNaN(w) && !isNaN(s) && !isNaN(e) && !isNaN(n)) {
            zoomToFeature(map, { w, s, e, n }, { padding: sidebarAwarePadding })
          }
        } else if (park.latitude && park.longitude) {
          const lat = typeof park.latitude === 'number' ? park.latitude : Number(park.latitude)
          const lng = typeof park.longitude === 'number' ? park.longitude : Number(park.longitude)
          if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            zoomToFeature(map, { lat, lng }, { padding: sidebarAwarePadding })
          }
        }
      } else if (selectedSearchResult.type === 'trail' && trails) {
        const trail = selectedFeature as TransformedTrail
        if (trail.lat && trail.lng) {
          zoomToFeature(map, { lat: Number(trail.lat), lng: Number(trail.lng) }, { padding: sidebarAwarePadding })
        }
        // Fetch and highlight trail geometry
        const trailId = Number(selectedSearchResult.gid)
        if (!isNaN(trailId)) {
          currentTrailRef.current = trailId
          getTrailGeometry(trailId)
            .then((geometry) => {
              if (currentTrailRef.current === trailId && geometry && map) {
                highlightTrailLine(map, geometry)
              }
            })
            .catch((error) => {
              console.error('Error highlighting trail:', error)
            })
        }
      }
      zoomedFeatureIdRef.current = featureId
    }

    // Clear flag after processing
    shouldZoomRef.current = false
  }, [selectedFeature, selectedSearchResult, map, sidebarAwarePadding, boundariesByParkName, parks, trails])

  // Clear highlights when component unmounts or selection changes
  useEffect(() => {
    return () => {
      if (map) {
        clearTrailHighlight(map)
      }
    }
  }, [map, selectedSearchResult])

  // Manage attraction marker based on selected feature type
  useEffect(() => {
    if (!map) return

    if (selectedSearchResult?.type === 'attraction') {
      const attraction = selectedFeature as TransformedAttraction
      const lat = typeof attraction.latitude === 'number' ? attraction.latitude : Number(attraction.latitude)
      const lng = typeof attraction.longitude === 'number' ? attraction.longitude : Number(attraction.longitude)
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        placeAttractionMarker(map, lat, lng)
      }
    } else {
      // Clear marker when other feature types are selected or no selection
      clearAttractionMarker(map)
    }
  }, [selectedSearchResult, selectedFeature, map])

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [autocompleteSuggestions])

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle coordinate searches - zoom directly without showing as result
  useEffect(() => {
    if (coordinates && map) {
      const lnglat = new mapboxgl.LngLat(coordinates.lng, coordinates.lat)
      map.flyTo({
        center: lnglat,
        zoom: 16,
      })
      // Clear the search term after zooming
      setSearchTerm('')
    }
  }, [coordinates, map, setSearchTerm])

  // Show loading state only if data is actually still loading
  // This prevents the flash when clicking results - if data is loaded, selectedFeature
  // will be found synchronously via useMemo
  if (selectedSearchResult && !selectedFeature && isDataLoading) {
    return (
      <Box p="md" pr="sm" style={{ position: 'relative' }}>
        <Stack spacing="md">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => {
              // Clear URL params - selectedSearchResult will be null automatically
              setParams({ type: null, gid: null, fromSearch: null }, false, true)
            }}
            style={{ alignSelf: 'flex-start' }}
          >
            ← Search Results
          </Button>
          <Box style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader size="sm" />
          </Box>
        </Stack>
      </Box>
    )
  }

  // Show detail view if a search result is selected
  if (selectedSearchResult && selectedFeature) {
    if (selectedSearchResult.type === 'attraction') {
      const attraction = selectedFeature as TransformedAttraction

      return (
        <AttractionDetailPane
          attraction={attraction}
          categoriesMap={categoriesMap}
          activities={activities}
          backButton={
            <Button
              variant="subtle"
              size="sm"
              onClick={() => {
                zoomedFeatureIdRef.current = null
                // Clear URL params - selectedSearchResult will be null automatically
                setParams({ type: null, gid: null, fromSearch: null }, false, true)
              }}
              style={{ alignSelf: 'flex-start' }}
            >
              ← Search Results
            </Button>
          }
        />
      )
    }

    if (selectedSearchResult.type === 'reservation' && parks) {
      const park = selectedFeature as Reservation

      return (
        <ParkDetailPane
          park={park}
          backButton={
            <Button
              variant="subtle"
              size="sm"
              onClick={() => {
                zoomedFeatureIdRef.current = null
                // Clear URL params - selectedSearchResult will be null automatically
                setParams({ type: null, gid: null, fromSearch: null }, false, true)
              }}
              style={{ alignSelf: 'flex-start' }}
            >
              ← Search Results
            </Button>
          }
        />
      )
    }

    if (selectedSearchResult.type === 'trail' && trails) {
      const trail = selectedFeature as TransformedTrail

      return (
        <TrailDetailPane
          trail={trail}
          backButton={
            <Button
              variant="subtle"
              size="sm"
              onClick={() => {
                clearTrailHighlight(map)
                currentTrailRef.current = null
                zoomedFeatureIdRef.current = null
                // Clear URL params - selectedSearchResult will be null automatically
                setParams({ type: null, gid: null, fromSearch: null }, false, true)
              }}
              style={{ alignSelf: 'flex-start' }}
            >
              ← Search Results
            </Button>
          }
        />
      )
    }
  }

  const handleSearch = () => {
    setShowAutocomplete(false)
    submitSearch()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
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
          handleSearch()
        }
      }
    } else if (e.key === 'Enter') {
      setShowAutocomplete(false)
      handleSearch()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setShowAutocomplete(e.target.value.length >= 2)
  }

  const handleSuggestionClick = (suggestion: typeof autocompleteSuggestions[0]) => {
    if (!suggestion.location) return
    selectFromSuggestion(suggestion)
    setSearchTerm(suggestion.title)
    setShowAutocomplete(false)
    setSelectedIndex(-1)
    shouldZoomRef.current = true
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
  }

  const handleResultClick = (result: typeof searchResults[0]) => {
    // Handle geocode result - just zoom, no detail view
    if (result.id === 'geocode-result') {
      if (result.location && map) {
        const feature: { lat: number; lng: number; w?: number; s?: number; e?: number; n?: number } = {
          lat: result.location.lat,
          lng: result.location.lng,
        }
        if (result.w && result.s && result.e && result.n) {
          feature.w = result.w
          feature.s = result.s
          feature.e = result.e
          feature.n = result.n
        }
        zoomToFeature(map, feature, { padding: sidebarAwarePadding })
      }
      return
    }

    // Handle regular search results
    if (!result.location) {
      return
    }

    // Mark that we want to zoom (user initiated)
    shouldZoomRef.current = true

    // Update URL params with fromSearch flag to prevent tab switching
    // The selectedSearchResult will be derived from URL params (single source of truth)
    // Zoom will be handled by the useEffect when selectedSearchResult updates
    const urlType = searchToUrlType[result.type] || result.type

    setParams(
      {
        type: urlType,
        gid: String(result.gid),
        fromSearch: 'true', // Flag to prevent tab switching
      },
      false,
      true // pushState for back button
    )
  }

  return (
    <Box p="md" pr="sm" style={{ position: 'relative' }}>
      <PanelHeader title="Search" />
      <Stack spacing="md">
        <Box style={{ position: 'relative' }}>
          <TextInput
            ref={inputRef}
            placeholder="Search parks, trails, attractions..."
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchTerm.length >= 2 && autocompleteSuggestions.length > 0) {
                setShowAutocomplete(true)
              }
            }}
            rightSection={<Search size={16} />}
            size="lg"
            styles={{
              input: {
                height: '48px',
              },
            }}
          />

          {/* Autocomplete dropdown */}
          {showAutocomplete && autocompleteSuggestions.length > 0 && (
            <Box
              ref={autocompleteRef}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
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
                      <Badge size="xs" variant="light">
                        {getResultTypeLabel(suggestion.type)}
                      </Badge>
                    </Group>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Box>

        <Button onClick={handleSearch} fullWidth loading={isLoading}>
          Search
        </Button>

        {error && (
          <Alert color="red" title="Search Error">
            {error}
          </Alert>
        )}

        {isLoading && !isGeocoding && (
          <Box style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
            <Loader size="sm" />
          </Box>
        )}

        {isGeocoding && (
          <Box style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
            <Text size="sm" color="dimmed">
              No Cleveland Metroparks results found. Trying an address search...
            </Text>
          </Box>
        )}

        {!isLoading && searchResults.length > 0 && (
          <>
            <Text size="sm" weight={500} mb="xs">
              Results ({searchResults.length})
            </Text>
            <PanelList
              items={searchResults}
              keyExtractor={(result) => result.id}
              onClick={(result) => handleResultClick(result)}
              renderItem={(result) => (
                <>
                  <Text size="sm" weight={500}>
                    {result.title}
                  </Text>
                  <Group spacing="xs" mt={4}>
                    {getParkName(result.type, result.gid) && (
                      <Text size="xs" color="dimmed">
                        {getParkName(result.type, result.gid)}
                      </Text>
                    )}
                    <Badge size="xs" variant="light">
                      {getResultTypeLabel(result.type)}
                    </Badge>
                  </Group>
                </>
              )}
            />
          </>
        )}

        {!isLoading && searchResults.length === 0 && searchTerm && !error && (
          <Text size="sm" color="dimmed">
            No results found. Try a different search term.
          </Text>
        )}

        {!isLoading && searchResults.length === 0 && !searchTerm && (
          <Text size="sm" color="dimmed">
            Enter a search term to find parks, trails, or attractions.
          </Text>
        )}
      </Stack>
    </Box>
  )
}
