/**
 * Parse a WKT coordinate string into GeoJSON coordinates
 */
function parseCoordString(str: string): number[][] {
  return str
    .split(',')
    .map((pair) => {
      const [lng, lat] = pair.trim().split(/\s+/).map(Number)
      return [lng, lat]
    })
    .filter(([lng, lat]) => !isNaN(lng) && !isNaN(lat))
}

/**
 * Convert WKT string to GeoJSON geometry
 *
 * Supports LINESTRING and MULTILINESTRING (used by directions API).
 * The old site uses Wkt.js; this is a minimal parser for our use case.
 */
export function wktToGeoJSON(wkt: string): GeoJSON.Geometry | null {
  try {
    const lineMatch = wkt.match(/^LINESTRING\s*\((.+)\)$/i)
    if (lineMatch) {
      const coords = parseCoordString(lineMatch[1])
      return { type: 'LineString', coordinates: coords }
    }

    const multiMatch = wkt.match(/^MULTILINESTRING\s*\((.+)\)$/i)
    if (multiMatch) {
      const inner = multiMatch[1]
      const lines: number[][][] = []
      let depth = 0
      let current = ''
      for (const ch of inner) {
        if (ch === '(') {
          depth++
          continue
        }
        if (ch === ')') {
          depth--
          if (depth === 0) {
            lines.push(parseCoordString(current))
            current = ''
          }
          continue
        }
        if (ch === ',' && depth === 0) continue
        current += ch
      }
      return { type: 'MultiLineString', coordinates: lines }
    }

    return null
  } catch {
    return null
  }
}
