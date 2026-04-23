import { useQuery } from '@tanstack/react-query'
import { getTrails } from '../lib/api'
import type { TransformedTrail } from '../types/api'

export function useTrailsData() {
  return useQuery<TransformedTrail[], Error>({
    queryKey: ['trails'],
    queryFn: getTrails,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  })
}
