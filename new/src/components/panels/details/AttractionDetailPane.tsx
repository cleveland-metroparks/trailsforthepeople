import { Text, Box, Anchor, Divider, Stack, Group } from '@mantine/core'
import type { ReactNode } from 'react'
import { ActivityIcon } from '../../ActivityIcon'
import { FeatureDetailLayout } from './FeatureDetailLayout'
import { MetadataBadge } from '../../MetadataBadge'
import type { Activity, TransformedAttraction } from '../../../types/api'
import {
  DetailTitle,
  DetailParkSection,
  DetailImage,
  DetailDescription,
  DetailHoursSection,
  DetailPhoneSection,
  DetailDirectionsSection,
  DetailShareSection,
} from './DetailSections'

interface AttractionDetailPaneProps {
  attraction: TransformedAttraction
  categoriesMap: Record<number, string>
  activities: Array<Activity & { icon?: string | null }>
  parkName?: string | null
  backButton: ReactNode
  panelTitle?: string
}

export function AttractionDetailPane({
  attraction,
  categoriesMap,
  activities,
  parkName,
  backButton,
  panelTitle,
}: AttractionDetailPaneProps) {
  const categoryNames = attraction.categories
    ? attraction.categories
        .map((id) => categoriesMap[id])
        .filter((name): name is string => Boolean(name))
    : null

  const activityIcons = attraction.activities
    ? attraction.activities
        .map((activityId) => activities.find((a) => a.eventactivitytypeid === activityId))
        .filter((activity): activity is Activity & { icon: string } =>
          Boolean(activity && activity.icon)
        )
    : []

  const sortedActivityIcons = [...activityIcons].sort((a, b) =>
    String(a?.pagetitle ?? '').localeCompare(String(b?.pagetitle ?? ''))
  )

  const cmpUrl = attraction.cmp_url
  const cmpHref = cmpUrl
    ? (cmpUrl.startsWith('/') ? `https://www.clevelandmetroparks.com${cmpUrl}` : cmpUrl)
    : null

  return (
    <FeatureDetailLayout panelTitle={panelTitle} backButton={backButton}>
      <Stack spacing={2}>
        <DetailTitle title={String(attraction.pagetitle)} />
        <DetailParkSection parkName={parkName} />
      </Stack>

      {categoryNames && categoryNames.length > 0 && (
        <Group spacing="xs">
          {categoryNames.map((categoryName, index) => (
            <MetadataBadge key={`${categoryName}-${index}`}>
              {categoryName}
            </MetadataBadge>
          ))}
        </Group>
      )}

      {sortedActivityIcons.length > 0 && (
        <Box>
          <Text size="sm" weight={500} mb={4}>
            Activities:
          </Text>
          <Box
            component="ul"
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5em',
            }}
          >
            {sortedActivityIcons.map((activity) => (
              <Box
                key={activity.eventactivitytypeid}
                component="li"
                style={{
                  display: 'inline-block',
                }}
              >
                <ActivityIcon
                  icon={activity.icon}
                  alt={activity.pagetitle}
                  title={activity.pagetitle}
                  size={24}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <DetailImage pagethumbnail={attraction.pagethumbnail ?? undefined} alt={String(attraction.pagetitle)} />
      <DetailDescription text={attraction.descr ?? undefined} />
      <DetailHoursSection hours={attraction.hoursofoperation ?? undefined} />
      <DetailPhoneSection phone={attraction.phone ?? undefined} />

      {cmpHref && (
        <>
          <Box>
            <Anchor href={cmpHref} target="_blank" size="sm">
              More info on clevelandmetroparks.com
            </Anchor>
          </Box>
          <Divider />
        </>
      )}

      <DetailDirectionsSection
        targetName={String(attraction.pagetitle)}
        lat={attraction.latitude}
        lng={attraction.longitude}
      />
      <DetailShareSection />
    </FeatureDetailLayout>
  )
}
