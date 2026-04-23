import { Box, Stack, Button, TextInput, Text } from '@mantine/core'
import { Copy } from 'tabler-icons-react'
import { useState, useEffect } from 'react'
import { PanelHeader } from '../PanelHeader'

interface SharePanelProps {
  onClose: () => void
}

export function SharePanel(_props: SharePanelProps) {
  const [shareUrl, setShareUrl] = useState(() => window.location.href)

  // Keep displayed URL in sync (map/selection update URL via replaceState)
  useEffect(() => {
    setShareUrl(window.location.href)
    const interval = setInterval(() => setShareUrl(window.location.href), 1500)
    return () => clearInterval(interval)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  return (
    <Box p="md" pr="sm" style={{ position: 'relative' }}>
      <PanelHeader title="Share" />
      <Text pb="md">Share this map:</Text>
      <Stack spacing="md">
        <TextInput
          value={shareUrl}
          readOnly
          style={{ width: '100%' }}
        />
        <Button leftIcon={<Copy size={16} />} onClick={handleCopy} fullWidth>
          Copy
        </Button>
      </Stack>
    </Box>
  )
}
