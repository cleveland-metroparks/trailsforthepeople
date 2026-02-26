import { Group, Text, Popover, TextInput, ActionIcon, Box } from '@mantine/core'
import { Share, Copy, Check } from 'tabler-icons-react'
import { useState, useEffect } from 'react'

export function ShareButton() {
  const [opened, setOpened] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState(() => window.location.href)

  useEffect(() => {
    if (!opened) return
    setShareUrl(window.location.href)
    const interval = setInterval(() => setShareUrl(window.location.href), 1500)
    return () => clearInterval(interval)
  }, [opened])

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-start"
      shadow="md"
      width={280}
    >
      <Popover.Target>
        <Group
          spacing="xs"
          align="center"
          onClick={() => setOpened((o) => !o)}
          style={{ cursor: 'pointer' }}
        >
          <Share size={20} style={{ color: '#6AB03E', flexShrink: 0 }} />
          <Text size="sm">Share</Text>
        </Group>
      </Popover.Target>
      <Popover.Dropdown>
        <Box style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <TextInput
            value={shareUrl}
            readOnly
            size="xs"
            style={{ flex: 1 }}
          />
          <ActionIcon
            variant="filled"
            color={copied ? 'teal' : 'dark'}
            onClick={handleCopy}
            size="lg"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </ActionIcon>
        </Box>
      </Popover.Dropdown>
    </Popover>
  )
}
