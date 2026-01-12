import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { useSearchIndex, type SearchResult } from '../hooks/useSearchIndex'
import { strToLngLat } from '../lib/searchUtils'
import { geocodeAddress } from '../lib/api'

/**
 * Search result with location info
 */
export interface SearchResultWithLocation extends SearchResult {
  location?: {
    lat: number
    lng: number
  }
}

interface SearchContextType {
  searchTerm: string
  searchResults: SearchResultWithLocation[]
  autocompleteSuggestions: SearchResultWithLocation[]
  isLoading: boolean
  isGeocoding: boolean
  error: string | null
  coordinates: { lat: number; lng: number } | null // For coordinate searches (not shown as result)
  selectedSearchResult: SearchResultWithLocation | null
  setSearchTerm: (term: string) => void
  submitSearch: () => void
  clearSearch: () => void
  selectSearchResult: (result: SearchResultWithLocation) => void
  clearSelectedResult: () => void
  handleResultClick: (result: SearchResultWithLocation) => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResultWithLocation[]>([])
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<SearchResultWithLocation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedSearchResult, setSelectedSearchResult] = useState<SearchResultWithLocation | null>(null)

  const { search, autocomplete, isReady } = useSearchIndex()

  // Debounce timer for autocomplete
  const autocompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Convert SearchResult to SearchResultWithLocation
   */
  const enhanceResult = useCallback((result: SearchResult): SearchResultWithLocation => {
    return {
      ...result,
      location: result.lat && result.lng ? { lat: result.lat, lng: result.lng } : undefined,
    }
  }, [])

  // Store latest autocomplete function in ref to avoid dependency issues
  const autocompleteRef = useRef(autocomplete)
  const enhanceResultRef = useRef(enhanceResult)

  // Update refs when functions change
  useEffect(() => {
    autocompleteRef.current = autocomplete
    enhanceResultRef.current = enhanceResult
  }, [autocomplete, enhanceResult])

  /**
   * Update autocomplete suggestions (debounced)
   */
  useEffect(() => {
    // Clear existing timer
    if (autocompleteTimerRef.current) {
      clearTimeout(autocompleteTimerRef.current)
    }

    // Don't show suggestions if search term is too short or index not ready
    if (!searchTerm.trim() || searchTerm.length < 2 || !isReady) {
      setAutocompleteSuggestions([])
      return
    }

    // Debounce autocomplete
    autocompleteTimerRef.current = setTimeout(() => {
      const suggestions = autocompleteRef.current(searchTerm, 8)
      const enhanced = suggestions.map(enhanceResultRef.current)
      setAutocompleteSuggestions(enhanced)
    }, 300)

    return () => {
      if (autocompleteTimerRef.current) {
        clearTimeout(autocompleteTimerRef.current)
      }
    }
  }, [searchTerm, isReady]) // Removed autocomplete and enhanceResult from deps - they're stable

  /**
   * Perform search
   */
  const submitSearch = useCallback(async () => {
    const query = searchTerm.trim()
    if (!query) {
      setSearchResults([])
      setError(null)
      setCoordinates(null)
      return
    }

    setIsLoading(true)
    setError(null)
    setAutocompleteSuggestions([]) // Clear autocomplete when searching

    try {
      // First, check if it's coordinates
      const detectedCoordinates = strToLngLat(query)
      if (detectedCoordinates) {
        // It's coordinates - store them for the component to handle, but don't show as a result
        setCoordinates({ lat: detectedCoordinates.lat, lng: detectedCoordinates.lng })
        setSearchResults([]) // Clear any previous results
        setError(null)
        setIsLoading(false)
        return
      }

      // Clear coordinates if not a coordinate search
      setCoordinates(null)

      // Perform text search
      const results = search(query, 50)
      const enhancedResults = results.map(enhanceResult)

      if (enhancedResults.length === 0) {
        // No matches - try address geocoding
        setIsGeocoding(true)
        try {
          const geocodeResult = await geocodeAddress(query)
          setSearchResults([
            {
              id: 'geocode-result',
              title: geocodeResult.title,
              type: 'attraction' as const,
              lat: geocodeResult.lat,
              lng: geocodeResult.lng,
              gid: 'geocode',
              w: geocodeResult.w ?? undefined,
              s: geocodeResult.s ?? undefined,
              e: geocodeResult.e ?? undefined,
              n: geocodeResult.n ?? undefined,
              location: { lat: geocodeResult.lat, lng: geocodeResult.lng },
            },
          ])
          setError(null)
        } catch (geocodeError) {
          const errorMessage =
            geocodeError instanceof Error ? geocodeError.message : 'Failed to geocode address'
          setError(errorMessage)
          setSearchResults([])
        } finally {
          setIsGeocoding(false)
        }
      } else {
        setSearchResults(enhancedResults)
        setError(null)
      }
    } catch (err) {
      console.error('Search error:', err)
      setError('An error occurred while searching. Please try again.')
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, search, enhanceResult])

  /**
   * Clear search
   */
  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setSearchResults([])
    setAutocompleteSuggestions([])
    setError(null)
    setCoordinates(null)
    setSelectedSearchResult(null)
  }, [])

  /**
   * Select a search result for detail view
   */
  const selectSearchResult = useCallback((result: SearchResultWithLocation) => {
    setSelectedSearchResult(result)
  }, [])

  /**
   * Clear selected search result
   */
  const clearSelectedResult = useCallback(() => {
    setSelectedSearchResult(null)
  }, [])

  /**
   * Handle result click - placeholder, will be enhanced by component with map access
   */
  const handleResultClick = useCallback((result: SearchResultWithLocation) => {
    // This will be enhanced by the SearchPanel component that has access to map and URL state
    console.log('Result clicked:', result)
  }, [])

  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        searchResults,
        autocompleteSuggestions,
        isLoading: isLoading || isGeocoding,
        isGeocoding,
        error,
        coordinates,
        selectedSearchResult,
        setSearchTerm,
        submitSearch,
        clearSearch,
        selectSearchResult,
        clearSelectedResult,
        handleResultClick,
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}
