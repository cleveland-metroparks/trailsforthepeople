import { Text, Stack, Divider, Loader, Box } from '@mantine/core'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FeatureDetailLayout } from './FeatureDetailLayout'
import type { TransformedTrail } from '../../../types/api'
import {
  DetailTitle,
  DetailParkSection,
  DetailHtmlDescription,
  DetailDirectionsSection,
  DetailShareSection,
  DetailShowOnMapSection,
} from './DetailSections'
import { getTrailProfile } from '../../../lib/api'
import { ElevationProfileChart } from '../../charts/ElevationProfileChart'
import { useParksData } from '../../../hooks/useParksData'

interface TrailDetailPaneProps {
  trail: TransformedTrail
  parkName?: string | null
  backButton: ReactNode
  panelTitle?: string
}

export function TrailDetailPane({ trail, parkName, backButton, panelTitle }: TrailDetailPaneProps) {
  const trailId = Number(trail.id)
  const { data: parks } = useParksData()
  const reservationId = parks?.find((p) => p.pagetitle === (trail as { res?: string }).res)?.record_id

  const {
    data: elevationProfile,
    isLoading: profileLoading,
  } = useQuery({
    queryKey: ['trail_profile', trailId],
    queryFn: () => getTrailProfile(trailId),
    staleTime: 5 * 60 * 1000,
  })

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

      {profileLoading && (
        <Box style={{ display: 'flex', justifyContent: 'center', padding: '1rem', minHeight: 120 }}>
          <Loader size="sm" />
        </Box>
      )}
      {!profileLoading && elevationProfile && elevationProfile.length >= 2 && (
        <>
          <Divider />
          <Text size="sm" weight={600}>
            Elevation Profile
          </Text>
          <ElevationProfileChart data={elevationProfile} height={160} />
        </>
      )}

      {trail.description && <Divider />}
      <DetailHtmlDescription html={trail.description ?? undefined} />

      <Divider />
      <DetailShowOnMapSection lat={trail.lat} lng={trail.lng} />
      <DetailDirectionsSection
        targetName={String(trail.name)}
        lat={trail.lat}
        lng={trail.lng}
        reservationId={reservationId}
      />
      <DetailShareSection />
    </FeatureDetailLayout>
  )
}
