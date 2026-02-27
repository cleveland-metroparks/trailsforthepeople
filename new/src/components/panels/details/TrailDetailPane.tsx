import { Text, Stack, Divider } from '@mantine/core'
import type { ReactNode } from 'react'
import { FeatureDetailLayout } from './FeatureDetailLayout'
import type { TransformedTrail } from '../../../types/api'
import {
  DetailTitle,
  DetailParkSection,
  DetailHtmlDescription,
  DetailDirectionsSection,
  DetailShareSection,
} from './DetailSections'

interface TrailDetailPaneProps {
  trail: TransformedTrail
  parkName?: string | null
  backButton: ReactNode
  panelTitle?: string
}

export function TrailDetailPane({ trail, parkName, backButton, panelTitle }: TrailDetailPaneProps) {
  return (
    <FeatureDetailLayout panelTitle={panelTitle} backButton={backButton}>
      <Stack spacing={2}>
        <DetailTitle title={String(trail.name)} />
        <DetailParkSection parkName={parkName} />
      </Stack>

      <Stack spacing={0}>
        {trail.distancetext && (
          <Text size="sm">
            <span style={{ fontWeight: 600 }}>Length:</span> {trail.distancetext}
          </Text>
        )}

        {trail.hike && trail.durationtext_hike && (
          <Text size="sm">
            <span style={{ fontWeight: 600 }}>Est time, walking:</span> {trail.durationtext_hike}
          </Text>
        )}

        {trail.bike && trail.durationtext_bike && (
          <Text size="sm">
            <span style={{ fontWeight: 600 }}>Est time, bicycle:</span> {trail.durationtext_bike}
          </Text>
        )}

        {trail.bridle && trail.durationtext_bridle && (
          <Text size="sm">
            <span style={{ fontWeight: 600 }}>Est time, horseback:</span> {trail.durationtext_bridle}
          </Text>
        )}
      </Stack>

      {trail.description && <Divider />}
      <DetailHtmlDescription html={trail.description ?? undefined} />

      <Divider />
      <DetailDirectionsSection
        targetName={String(trail.name)}
        lat={trail.lat}
        lng={trail.lng}
      />
      <DetailShareSection />
    </FeatureDetailLayout>
  )
}
