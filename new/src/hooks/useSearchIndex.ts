import { useMemo } from 'react'
import { Document } from 'flexsearch'
import { useActivitiesData } from './useActivitiesData'
import { useParksData } from './useParksData'
import { useTrailsData } from './useTrailsData'

/**
 * Unified search item structure
 * Must have index signature to work with FlexSearch Document API
 */
export interface SearchItem {
  id: string
  title: string
  type: 'attraction' | 'reservation' | 'trail'
  lat?: number
  lng?: number
  gid: string | number // For URL params (gis_id, record_id, or trail id)
  // Optional bounding box for better zooming
  w?: number | null
  s?: number | null
  e?: number | null
  n?: number | null
  [key: string]: unknown // Index signature for FlexSearch compatibility
}

/**
 * Search result with score
 */
export interface SearchResult extends SearchItem {
  score?: number
}

/**
 * Hook to build and maintain FlexSearch index from React Query data
 *
 * Automatically rebuilds index when data changes
 */
export function useSearchIndex() {
  const { attractions } = useActivitiesData()
  const { data: reservations } = useParksData()
  const { data: trails } = useTrailsData()

  // Build unified search index
  const index = useMemo(() => {
    // Create FlexSearch Document index with optimized config
    const searchIndex = new Document({
      preset: 'match',
      tokenize: 'full', // Comprehensive tokenization
      resolution: 9, // Search resolution
      context: {
        resolution: 7,
        depth: 5,
        bidirectional: true, // Search both directions
      },
      document: {
        id: 'id',
        index: ['title'], // Primary search field
        store: true, // Store all fields for retrieval
      },
    })

    // Add attractions to index
    attractions.forEach((attraction) => {
      if (attraction.pagetitle) {
        const item: SearchItem = {
          id: `attraction-${attraction.gis_id || attraction.record_id}`,
          title: String(attraction.pagetitle),
          type: 'attraction',
          lat: Number(attraction.latitude),
          lng: Number(attraction.longitude),
          gid: String(attraction.gis_id || attraction.record_id || ''),
        }
        searchIndex.add(item as any)
      }
    })

    // Add reservations (parks) to index
    if (reservations) {
      reservations.forEach((reservation) => {
        if (reservation.pagetitle) {
          const item: SearchItem = {
            id: `reservation-${reservation.record_id}`,
            title: String(reservation.pagetitle),
            type: 'reservation',
            lat: Number(reservation.latitude),
            lng: Number(reservation.longitude),
            gid: String(reservation.record_id),
            w: reservation.boxw ? Number(reservation.boxw) : undefined,
            s: reservation.boxs ? Number(reservation.boxs) : undefined,
            e: reservation.boxe ? Number(reservation.boxe) : undefined,
            n: reservation.boxn ? Number(reservation.boxn) : undefined,
          }
          searchIndex.add(item as any)
        }
      })
    }

    // Add trails to index
    if (trails) {
      trails.forEach((trail) => {
        if (trail.name) {
          const item: SearchItem = {
            id: `trail-${trail.id}`,
            title: String(trail.name),
            type: 'trail',
            lat: Number(trail.lat),
            lng: Number(trail.lng),
            gid: String(trail.id),
            w: trail.boxw ? Number(trail.boxw) : undefined,
            s: trail.boxs ? Number(trail.boxs) : undefined,
            e: trail.boxe ? Number(trail.boxe) : undefined,
            n: trail.boxn ? Number(trail.boxn) : undefined,
          }
          searchIndex.add(item as any)
        }
      })
    }

    return searchIndex
  }, [attractions, reservations, trails])

  /**
   * Search the index
   *
   * @param query - Search query string
   * @param limit - Maximum number of results (default: 50)
   * @returns Array of search results
   */
  const search = useMemo(
    () => (query: string, limit: number = 50): SearchResult[] => {
      if (!query.trim() || !index) {
        return []
      }

      try {
        const results = index.search(query, {
          limit,
          enrich: true, // Return full document data
        })

        // FlexSearch Document API returns results in format:
        // [{ field: 'title', result: [id1, id2, ...] }]
        // With enrich: true, we get the full documents
        const flattened: SearchResult[] = []
        const seenIds = new Set<string>()

        for (const result of results) {
          if (result.field === 'title' && Array.isArray(result.result)) {
            for (const item of result.result) {
              // With enrich: true, item is { id, doc, highlight? }
              if (typeof item === 'object' && item !== null && 'doc' in item && item.doc) {
                const doc = item.doc as unknown as SearchItem
                if (doc && typeof doc === 'object' && 'id' in doc && 'title' in doc) {
                  if (!seenIds.has(doc.id)) {
                    seenIds.add(doc.id)
                    flattened.push(doc as SearchResult)
                  }
                }
              }
            }
          }
        }
        return flattened.slice(0, limit)
      } catch (error) {
        console.error('Search error:', error)
        return []
      }
    },
    [index]
  )

  /**
   * Get autocomplete suggestions
   *
   * @param query - Search query string
   * @param limit - Maximum number of suggestions (default: 8)
   * @returns Array of search results
   */
  const autocomplete = useMemo(
    () => (query: string, limit: number = 8): SearchResult[] => {
      if (!query.trim() || query.length < 2 || !index) {
        return []
      }

      return search(query, limit)
    },
    [search]
  )

  return {
    index,
    search,
    autocomplete,
    isReady: !!index,
  }
}
