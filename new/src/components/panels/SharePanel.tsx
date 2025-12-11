import { Text, Box, Stack, Button, TextInput, Group, ActionIcon } from '@mantine/core'
import { Copy, Share, X } from 'tabler-icons-react'
import { useState } from 'react'

interface SharePanelProps {
  onClose: () => void
}

export function SharePanel({ onClose }: SharePanelProps) {
  const [shareUrl, setShareUrl] = useState('')

  const handleShare = () => {
    // TODO: Implement share functionality
    const currentUrl = window.location.href
    setShareUrl(currentUrl)
  }

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
    }
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
          Share This Map
        </Text>

        <Button leftIcon={<Share size={16} />} onClick={handleShare} fullWidth>
          Generate Share Link
        </Button>

        {shareUrl && (
          <Group spacing="xs">
            <TextInput
              value={shareUrl}
              readOnly
              style={{ flex: 1 }}
            />
            <Button leftIcon={<Copy size={16} />} onClick={handleCopy}>
              Copy
            </Button>
          </Group>
        )}

        <Text size="sm" color="dimmed">
          Share functionality coming soon...
        </Text>
      </Stack>
    </Box>
  )
}
