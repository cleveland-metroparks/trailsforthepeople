import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getActivities, getAttractions } from '../lib/api'
import type { Activity, TransformedAttraction } from '../types/api'
import { filterAttractionsByActivity } from '../lib/dataTransform'

const EMPTY_ACTIVITIES: (Activity & { icon: string | null })[] = []
const EMPTY_ATTRACTIONS: TransformedAttraction[] = []

export function useActivitiesData() {
  const activitiesQuery = useQuery<(Activity & { icon: string | null })[], Error>({
    queryKey: ['activities'],
    queryFn: getActivities,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  })

  const attractionsQuery = useQuery<TransformedAttraction[], Error>({
    queryKey: ['attractions'],
    queryFn: getAttractions,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  })

  // IMPORTANT: memoize the filtered attractions so this hook returns a stable
  // reference across renders. Without this, consumers (e.g. MapView) get a new
  // `attractions` array identity every render, which cascades into effect deps
  // and can tear down and re-install map event handlers on every render — which
  // manifests as map hover data and popups flickering or never appearing.
  const attractions = useMemo(
    () => (attractionsQuery.data ?? EMPTY_ATTRACTIONS).filter((a) => a.gis_id != null && a.gis_id !== ''),
    [attractionsQuery.data]
  )

  return {
    activities: activitiesQuery.data ?? EMPTY_ACTIVITIES,
    attractions,
    isLoading: activitiesQuery.isLoading || attractionsQuery.isLoading,
    isError: activitiesQuery.isError || attractionsQuery.isError,
    error: activitiesQuery.error || attractionsQuery.error,
  }
}

/**
 * Hook to get attractions filtered by activity ID(s)
 * This depends on attractions being loaded first
 */
export function useAttractionsByActivity(activityIds: number | number[] | null) {
  const { attractions, isLoading, isError, error } = useActivitiesData()

  const filteredAttractions = activityIds
    ? filterAttractionsByActivity(attractions, activityIds)
    : []

  return {
    attractions: filteredAttractions,
    isLoading,
    isError,
    error,
  }
}
