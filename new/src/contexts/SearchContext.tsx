import { createContext, useContext, useState, ReactNode } from 'react'

interface SearchResult {
  id: string
  name: string
  type: string
  location?: {
    lat: number
    lng: number
  }
  // Add more fields as needed
}

interface SearchContextType {
  searchTerm: string
  searchResults: SearchResult[]
  isLoading: boolean
  setSearchTerm: (term: string) => void
  submitSearch: () => void
  clearSearch: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const submitSearch = async () => {
    if (!searchTerm.trim()) {
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement actual search API call
      console.log('Searching for:', searchTerm)

      // Placeholder: simulate search results
      // Replace this with actual API call
      setTimeout(() => {
        setSearchResults([
          // Mock results - replace with actual API response
        ])
        setIsLoading(false)
      }, 500)
    } catch (error) {
      console.error('Search error:', error)
      setIsLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    setSearchResults([])
  }

  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        searchResults,
        isLoading,
        setSearchTerm,
        submitSearch,
        clearSearch,
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
