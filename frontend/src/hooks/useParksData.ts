import { useQuery } from '@tanstack/react-query'
import { getReservations } from '../lib/api'
import type { Reservation } from '../types/api'

export function useParksData() {
  return useQuery<Reservation[], Error>({
    queryKey: ['parks', 'reservations'],
    queryFn: getReservations,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  })
}
