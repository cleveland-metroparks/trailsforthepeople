import { TextInput, Button, Stack, Text, Box, Loader } from '@mantine/core'
import { Search } from 'tabler-icons-react'
import { useSearch } from '../../contexts/SearchContext'

interface SearchPanelProps {
  onClose: () => void
}

export function SearchPanel({ onClose: _onClose }: SearchPanelProps) {
  const { searchTerm, setSearchTerm, searchResults, isLoading, submitSearch } = useSearch()

  const handleSearch = () => {
    submitSearch()
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <Box p="md" style={{ position: 'relative' }}>
      <Stack spacing="md">
        <TextInput
          placeholder="Search parks, trails, activities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          rightSection={<Search size={16} />}
          size="lg"
          styles={{
            input: {
              height: '48px',
            },
          }}
        />

        <Button onClick={handleSearch} fullWidth loading={isLoading}>
          Search
        </Button>

        {isLoading && (
          <Box style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
            <Loader size="sm" />
          </Box>
        )}

        {!isLoading && searchResults.length > 0 && (
          <Stack spacing="xs">
            <Text size="sm" weight={500}>
              Results ({searchResults.length})
            </Text>
            {searchResults.map((result) => (
              <Box
                key={result.id}
                p="sm"
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <Text size="sm" weight={500}>
                  {result.name}
                </Text>
                {result.type && (
                  <Text size="xs" color="dimmed">
                    {result.type}
                  </Text>
                )}
              </Box>
            ))}
          </Stack>
        )}

        {!isLoading && searchResults.length === 0 && searchTerm && (
          <Text size="sm" color="dimmed">
            No results found. Try a different search term.
          </Text>
        )}

        {!isLoading && searchResults.length === 0 && !searchTerm && (
          <Text size="sm" color="dimmed">
            Enter a search term to find parks, trails, or activities.
          </Text>
        )}
      </Stack>
    </Box>
  )
}
