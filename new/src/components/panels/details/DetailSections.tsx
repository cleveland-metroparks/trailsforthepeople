import { Text, Box, Anchor, Divider, Group, Button } from '@mantine/core'
import { Clock, Phone, Map } from 'tabler-icons-react'
import { makeImageFromPagethumbnail } from '../../../lib/dataTransform'
import { GetDirectionsButtons } from '../../GetDirectionsButtons'
import { ShareButton } from '../../ShareButton'
import { useSidebar } from '../../../contexts/SidebarContext'
import { useMap } from '../../../contexts/MapContext'
import { zoomToFeature } from '../../../lib/mapUtils'

interface DetailTitleProps {
  title: string
}

export function DetailTitle({ title }: DetailTitleProps) {
  return (
    <Text size="lg" weight={900}>
      {title}
    </Text>
  )
}

interface DetailParkSectionProps {
  parkName?: string | null
}

export function DetailParkSection({ parkName }: DetailParkSectionProps) {
  if (!parkName) return null

  return (
    <Text size="sm" color="dimmed">
      {parkName}
    </Text>
  )
}

interface DetailImageProps {
  pagethumbnail?: string
  alt: string
}

export function DetailImage({ pagethumbnail, alt }: DetailImageProps) {
  const imgProps = makeImageFromPagethumbnail(pagethumbnail, 320)
  if (!imgProps) return null

  return (
    <Box>
      <img
        src={imgProps.src}
        width={imgProps.width}
        height={imgProps.height}
        alt={alt}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </Box>
  )
}

const EMPTY_LINE = /^(\s|&nbsp;|\u00A0)*$/i
const EMPTY_P_TAG = /<p(?:\s[^>]*)?>(\s|&nbsp;|\u00A0)*<\/p>/gi

function removeEmptyLines(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => !EMPTY_LINE.test(line))
    .join('\n')
}

function cleanHtmlDescription(html: string): string {
  return removeEmptyLines(html).replace(EMPTY_P_TAG, '').trim()
}

interface DetailDescriptionProps {
  text?: string
}

export function DetailDescription({ text }: DetailDescriptionProps) {
  if (!text) return null

  return (
    <Text size="sm" className="detail-description" style={{ margin: 0 }}>
      {removeEmptyLines(text)}
    </Text>
  )
}

interface DetailHtmlDescriptionProps {
  html?: string
}

export function DetailHtmlDescription({ html }: DetailHtmlDescriptionProps) {
  if (!html) return null

  return (
    <Text
      size="sm"
      className="detail-description"
      style={{ margin: 0 }}
      dangerouslySetInnerHTML={{ __html: cleanHtmlDescription(html) }}
    />
  )
}

interface DetailHoursSectionProps {
  hours?: string
}

export function DetailHoursSection({ hours }: DetailHoursSectionProps) {
  if (!hours) return null

  return (
    <>
      <Group spacing="xs" align="flex-start">
        <Clock size={20} style={{ color: '#6AB03E', flexShrink: 0, marginTop: 2 }} />
        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
          {hours}
        </Text>
      </Group>
      <Divider />
    </>
  )
}

interface DetailPhoneSectionProps {
  phone?: string
}

export function DetailPhoneSection({ phone }: DetailPhoneSectionProps) {
  if (!phone) return null

  return (
    <>
      <Group spacing="xs" align="center">
        <Phone size={20} style={{ color: '#6AB03E', flexShrink: 0 }} />
        <Anchor href={`tel:${phone}`} size="sm" className="phone-link">
          {phone}
        </Anchor>
      </Group>
      <Divider />
    </>
  )
}

interface DetailDirectionsSectionProps {
  targetName: string
  lat?: number
  lng?: number
  reservationId?: string | number
}

export function DetailDirectionsSection({ targetName, lat, lng, reservationId }: DetailDirectionsSectionProps) {
  const hasCoordinates =
    typeof lat === 'number' &&
    Number.isFinite(lat) &&
    typeof lng === 'number' &&
    Number.isFinite(lng)

  if (!hasCoordinates) return null

  return (
    <>
      <GetDirectionsButtons
        target={{
          name: targetName,
          lat,
          lng,
          reservationId,
        }}
      />
      <Divider />
    </>
  )
}

export function DetailShareSection() {
  return <ShareButton />
}

interface DetailShowOnMapSectionProps {
  lat?: number
  lng?: number
  boxw?: number | null
  boxs?: number | null
  boxe?: number | null
  boxn?: number | null
}

export function DetailShowOnMapSection({ lat, lng, boxw, boxs, boxe, boxn }: DetailShowOnMapSectionProps) {
  const { isMobile, onCollapseSheet } = useSidebar()
  const { map } = useMap()

  if (!isMobile) return null
  if (typeof lat !== 'number' || typeof lng !== 'number') return null

  const handleShowOnMap = () => {
    const hasBbox =
      typeof boxw === 'number' &&
      typeof boxs === 'number' &&
      typeof boxe === 'number' &&
      typeof boxn === 'number'
    if (hasBbox && typeof boxw === 'number' && typeof boxs === 'number' && typeof boxe === 'number' && typeof boxn === 'number') {
      zoomToFeature(map, { w: boxw, s: boxs, e: boxe, n: boxn }, { padding: 40 })
    } else {
      zoomToFeature(map, { lat, lng })
    }
    onCollapseSheet()
  }

  return (
    <Button
      fullWidth
      variant="outline"
      leftIcon={<Map size={16} />}
      onClick={handleShowOnMap}
      styles={{
        root: {
          borderColor: '#6AB03E',
          color: '#6AB03E',
          '&:hover': { backgroundColor: '#f0f9e8', borderColor: '#5a9a34', color: '#5a9a34' },
        },
      }}
    >
      Show on map
    </Button>
  )
}
