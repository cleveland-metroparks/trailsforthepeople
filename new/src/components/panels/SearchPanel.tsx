import { TextInput, Button, Stack, Text, Box } from '@mantine/core'
import { Search } from 'tabler-icons-react'
import { useState } from 'react'

export function SearchPanel() {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log('Searching for:', searchTerm)
  }

  return (
    <Box p="md">
      <Stack spacing="md">
        <Text size="lg" weight={500}>
          Find Parks & Trails
        </Text>

        <TextInput
          placeholder="Search for parks, trails, or activities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          rightSection={<Search size={16} />}
        />

        <Button onClick={handleSearch} fullWidth>
          Search
        </Button>

        <Text size="sm" color="dimmed">
          Search functionality coming soon...
        </Text>
      </Stack>
    </Box>
  )
}
