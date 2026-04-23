import { useQuery } from '@tanstack/react-query'
import { getReservationBoundaries } from '../lib/api'
import type { ReservationBoundary } from '../types/api'

export function useReservationBoundaries() {
  return useQuery<ReservationBoundary[], Error>({
    queryKey: ['reservation_boundaries'],
    queryFn: getReservationBoundaries,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  })
}
