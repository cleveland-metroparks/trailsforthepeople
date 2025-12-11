import { TextInput, Button, Stack, Text, Box, ActionIcon } from '@mantine/core'
import { Search, X } from 'tabler-icons-react'
import { useState } from 'react'

interface SearchPanelProps {
  onClose: () => void
}

export function SearchPanel({ onClose }: SearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log('Searching for:', searchTerm)
  }

  return (
    <Box p="md" style={{ position: 'relative' }}>
      <ActionIcon
        style={{ position: 'absolute', top: 16, right: 16 }}
        onClick={onClose}
        variant="subtle"
        color="gray"
      >
        <X size={18} />
      </ActionIcon>
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
