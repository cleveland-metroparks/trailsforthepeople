import { useCallback } from 'react'
import { geocodeAddress } from '../lib/api'

/**
 * Hook to resolve text input to lat/lng coordinates.
 *
 * Uses existing coordinates if available, otherwise:
 * - Parses "lat, lng" coordinate strings
 * - Falls back to geocoding API for addresses
 */
export function useResolveLocation() {
  return useCallback(
    async (
      text: string,
      existingLngLat: { lat: number; lng: number } | null
    ): Promise<{ lat: number; lng: number } | null> => {
      if (existingLngLat) return existingLngLat
      if (!text.trim()) return null

      // Check if text looks like "lat, lng"
      const match = text.match(
        /^([-+]?(?:[1-8]?\d(?:\.\d+)?|90(?:\.0+)?))\s*,\s*([-+]?(?:180(?:\.0+)?|(?:1[0-7]\d|[1-9]?\d)(?:\.\d+)?))$/
      )
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
      }

      // Geocode the address
      const geocoded = await geocodeAddress(text)
      return { lat: geocoded.lat, lng: geocoded.lng }
    },
    []
  )
}
