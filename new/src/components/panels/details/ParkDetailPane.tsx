import type { ReactNode } from 'react'
import { FeatureDetailLayout } from './FeatureDetailLayout'
import type { Reservation } from '../../../types/api'
import {
  DetailTitle,
  DetailImage,
  DetailDescription,
  DetailHoursSection,
  DetailPhoneSection,
  DetailDirectionsSection,
  DetailShareSection,
  DetailShowOnMapSection,
} from './DetailSections'

interface ParkDetailPaneProps {
  park: Reservation
  backButton: ReactNode
  panelTitle?: string
}

export function ParkDetailPane({ park, backButton, panelTitle }: ParkDetailPaneProps) {
  return (
    <FeatureDetailLayout panelTitle={panelTitle} backButton={backButton}>
      <DetailTitle title={park.pagetitle} />
      <DetailImage pagethumbnail={park.pagethumbnail ?? undefined} alt={park.pagetitle} />
      <DetailDescription text={park.descr ?? undefined} />
      <DetailHoursSection hours={park.hoursofoperation ?? undefined} />
      <DetailPhoneSection phone={park.phone ?? undefined} />
      <DetailShowOnMapSection lat={park.latitude} lng={park.longitude} boxw={park.boxw} boxs={park.boxs} boxe={park.boxe} boxn={park.boxn} />
      <DetailDirectionsSection targetName={park.pagetitle} lat={park.latitude} lng={park.longitude} reservationId={park.record_id} />
      <DetailShareSection />
    </FeatureDetailLayout>
  )
}
