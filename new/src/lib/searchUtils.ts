import mapboxgl from 'mapbox-gl'

/**
 * Parse a string to coordinates (LngLat)
 *
 * Supports these formats:
 * - Decimal: "44.589033 -123.26115" or "44.589033, -123.26115"
 * - GPS format: "N 44 35.342 W 123 15.669"
 *
 * @param text - The text to parse
 * @returns LngLat object if valid coordinates found, null otherwise
 */
export function strToLngLat(text: string): mapboxgl.LngLat | null {
  const trimmed = text.replace(/\s+$/, '').replace(/^\s+/, '')

  // Simplest format is decimal numbers and minus signs and that's about it.
  // One of them must be negative, which means it's the longitude here in North America
  if (trimmed.match(/^[\d.\-,\s]+$/)) {
    const coords = trimmed.split(/[\s,]+/)
    if (coords.length === 2) {
      const coord1 = parseFloat(coords[0])
      const coord2 = parseFloat(coords[1])
      if (!isNaN(coord1) && !isNaN(coord2)) {
        let lat: number
        let lng: number
        if (coord1 < 0) {
          lat = coord2
          lng = coord1
        } else {
          lat = coord1
          lng = coord2
        }
        return new mapboxgl.LngLat(lng, lat)
      }
    }
  }

  // GPS/geocaching format: N xx xx.xxx W xxx xx.xxx
  const gpsMatch = trimmed.match(/^N\s*(\d\d)\s+(\d\d\.\d\d\d)\s+W\s*(\d\d\d)\s+(\d\d\.\d\d\d)$/i)
  if (gpsMatch) {
    const latd = parseInt(gpsMatch[1], 10)
    const latm = parseFloat(gpsMatch[2])
    const lond = parseInt(gpsMatch[3], 10)
    const lonm = parseFloat(gpsMatch[4])

    const lat = latd + latm / 60
    const lng = -(lond + lonm / 60)

    return new mapboxgl.LngLat(lng, lat)
  }

  // Nothing matched; bail
  return null
}

/**
 * Get human-readable label for search result type
 *
 * @param type - The result type ('attraction', 'reservation', 'trail')
 * @returns Human-readable label
 */
export function getResultTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    attraction: 'Attraction',
    reservation: 'Park',
    reservation_new: 'Park',
    trail: 'Trail',
    loop: 'Trail',
  }
  return typeMap[type] || type
}
