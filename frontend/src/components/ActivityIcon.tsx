import { Box, Image } from '@mantine/core'

interface ActivityIconProps {
  icon: string
  alt: string
  title?: string
  size?: number
}

/**
 * Reusable component for displaying activity icons with consistent background padding.
 * The icon is displayed in a dark box with border to provide visual padding.
 */
export function ActivityIcon({ icon, alt, title, size = 24 }: ActivityIconProps) {
  const boxSize = size + 4 // Box is 4px larger than icon (2px border on each side)
  
  return (
    <Box
      style={{
        flexShrink: 0,
        width: `${boxSize}px`,
        height: `${boxSize}px`,
        border: '2px solid #373735',
        borderRadius: '4px',
        backgroundColor: '#373735',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        src={icon}
        alt={alt}
        title={title || alt}
        w={size}
        h={size}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          maxWidth: `${size}px`,
          maxHeight: `${size}px`,
          objectFit: 'contain',
        }}
      />
    </Box>
  )
}
