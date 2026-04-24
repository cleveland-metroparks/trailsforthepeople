import { Text, Popover, TextInput, ActionIcon, Box, UnstyledButton } from '@mantine/core'
import { Share, Copy, Check } from 'tabler-icons-react'
import { useState, useEffect } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'

export function ShareButton() {
  const isDarkMode = useDarkMode()
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
        <UnstyledButton
          type="button"
          onClick={() => setOpened((o) => !o)}
          aria-label="Share this location"
          aria-expanded={opened}
          aria-haspopup="dialog"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
          sx={{
            '&:hover': {
              opacity: 0.8,
            },
            '&:focus-visible': {
              outline: '2px solid #6AB03E',
              outlineOffset: '2px',
            },
          }}
        >
          <Share size={20} style={{ color: '#6AB03E', flexShrink: 0 }} />
          <Text
            size="sm"
            style={{ color: isDarkMode ? '#FFFFFF' : '#000000', textDecoration: 'underline', textUnderlineOffset: '2px' }}
          >
            Share
          </Text>
        </UnstyledButton>
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
            aria-label={copied ? 'Copied link' : 'Copy link'}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </ActionIcon>
        </Box>
      </Popover.Dropdown>
    </Popover>
  )
}
