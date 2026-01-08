import mapboxgl from 'mapbox-gl'
import bbox from '@turf/bbox'

// Default zoom level for points of interest (matches old DEFAULT_POI_ZOOM)
export const DEFAULT_POI_ZOOM = 15

// Default padding for fitBounds (in pixels)
const DEFAULT_PADDING = 10

/**
 * Feature with point coordinates
 */
export interface PointFeature {
  lat: number
  lng: number
}

/**
 * Feature with bounding box coordinates
 */
export interface BoundingBoxFeature {
  w: number // west (longitude)
  s: number // south (latitude)
  e: number // east (longitude)
  n: number // north (latitude)
}

/**
 * Feature that can be either a point or bounding box
 */
export type MapFeature = PointFeature | BoundingBoxFeature | (PointFeature & Partial<BoundingBoxFeature>)

/**
 * Options for zooming to a feature
 */
export interface ZoomToFeatureOptions {
  /** Custom zoom level for point features (default: DEFAULT_POI_ZOOM) */
  zoom?: number
  /** Padding in pixels for bounding box fits (default: 10) */
  padding?: number
  /** Duration of the animation in milliseconds (default: mapbox default) */
  duration?: number
  /** Whether to use flyTo animation (default: true) */
  animate?: boolean
}

/**
 * Check if coordinates are valid
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

/**
 * Check if a feature has a valid bounding box
 */
function hasValidBoundingBox(feature: MapFeature): feature is BoundingBoxFeature {
  const bbox = feature as BoundingBoxFeature
  return (
    typeof bbox.w === 'number' &&
    typeof bbox.s === 'number' &&
    typeof bbox.e === 'number' &&
    typeof bbox.n === 'number' &&
    !isNaN(bbox.w) &&
    !isNaN(bbox.s) &&
    !isNaN(bbox.e) &&
    !isNaN(bbox.n) &&
    bbox.w !== 0 &&
    bbox.s !== 0 &&
    bbox.e !== 0 &&
    bbox.n !== 0 &&
    bbox.w < bbox.e && // west must be less than east
    bbox.s < bbox.n // south must be less than north
  )
}

/**
 * Check if a feature has valid point coordinates
 */
function hasValidPoint(feature: MapFeature): feature is PointFeature {
  const point = feature as PointFeature
  return (
    typeof point.lat === 'number' &&
    typeof point.lng === 'number' &&
    isValidCoordinate(point.lat, point.lng)
  )
}

/**
 * Zoom to a feature on the map
 *
 * Similar to zoomToFeature() in mobile.js, but with improved type safety and options.
 *
 * @param map - The mapbox map instance (can be null)
 * @param feature - Feature object with lat/lng point or bounding box (w, s, e, n)
 * @param options - Optional configuration for zoom behavior
 *
 * @example
 * ```ts
 * // Zoom to a point
 * zoomToFeature(map, { lat: 41.3953, lng: -81.6730 })
 *
 * // Zoom to a bounding box
 * zoomToFeature(map, { w: -82, s: 41, e: -81, n: 42 })
 *
 * // With custom options
 * zoomToFeature(map, { lat: 41.3953, lng: -81.6730 }, { zoom: 18, duration: 2000 })
 * ```
 */
export function zoomToFeature(
  map: mapboxgl.Map | null,
  feature: MapFeature,
  options: ZoomToFeatureOptions = {}
): void {
  if (!map) {
    console.warn('zoomToFeature: Map instance is null')
    return
  }

  const {
    zoom = DEFAULT_POI_ZOOM,
    padding = DEFAULT_PADDING,
    duration,
    animate = true,
  } = options

  // Prefer bounding box if available and valid
  if (hasValidBoundingBox(feature)) {
    try {
      const sw = new mapboxgl.LngLat(feature.w, feature.s)
      const ne = new mapboxgl.LngLat(feature.e, feature.n)
      const bounds = new mapboxgl.LngLatBounds(sw, ne)

      const fitBoundsOptions: Parameters<mapboxgl.Map['fitBounds']>[1] = { padding }
      if (duration !== undefined) {
        fitBoundsOptions.duration = duration
      }
      if (!animate) {
        fitBoundsOptions.duration = 0
      }

      map.fitBounds(bounds, fitBoundsOptions)
      return
    } catch (error) {
      console.warn('zoomToFeature: Invalid bounding box, falling back to point', error)
    }
  }

  // Fall back to point coordinates
  if (hasValidPoint(feature)) {
    const flyToOptions: Parameters<mapboxgl.Map['flyTo']>[0] = {
      center: [feature.lng, feature.lat],
      zoom,
    }

    if (duration !== undefined) {
      flyToOptions.duration = duration
    }
    if (!animate) {
      flyToOptions.duration = 0
    }

    map.flyTo(flyToOptions)
    return
  }

  console.warn('zoomToFeature: No valid coordinates found in feature', feature)
}

// Constants for park highlight layer
const PARK_HIGHLIGHT_SOURCE_ID = 'park-highlight-source'
const PARK_HIGHLIGHT_LAYER_ID = 'park-highlight-layer'

/**
 * Highlight a park boundary on the map using GeoJSON geometry
 *
 * @param map - The mapbox map instance (can be null)
 * @param geometry - GeoJSON geometry (Polygon or MultiPolygon)
 */
export function highlightParkBoundary(
  map: mapboxgl.Map | null,
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): void {
  if (!map) {
    return
  }

  if (!geometry || (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon')) {
    return
  }

  const feature: GeoJSON.Feature = {
    type: 'Feature',
    geometry: geometry,
    properties: {},
  }

  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [feature],
  }

  // Wait for map to be loaded if needed
  if (!map.isStyleLoaded()) {
    map.once('style.load', () => {
      addHighlightLayer(map, geojson)
    })
  } else {
    addHighlightLayer(map, geojson)
  }
}

/**
 * Add or update the highlight layer on the map
 */
function addHighlightLayer(map: mapboxgl.Map, geojson: GeoJSON.FeatureCollection): void {
  // Remove existing layer and source if they exist
  if (map.getLayer(PARK_HIGHLIGHT_LAYER_ID)) {
    map.removeLayer(PARK_HIGHLIGHT_LAYER_ID)
  }
  if (map.getLayer(`${PARK_HIGHLIGHT_LAYER_ID}-outline`)) {
    map.removeLayer(`${PARK_HIGHLIGHT_LAYER_ID}-outline`)
  }
  if (map.getSource(PARK_HIGHLIGHT_SOURCE_ID)) {
    map.removeSource(PARK_HIGHLIGHT_SOURCE_ID)
  }

  // Add the source
  map.addSource(PARK_HIGHLIGHT_SOURCE_ID, {
    type: 'geojson',
    data: geojson,
  })

  // Add the fill layer
  map.addLayer({
    id: PARK_HIGHLIGHT_LAYER_ID,
    type: 'fill',
    source: PARK_HIGHLIGHT_SOURCE_ID,
    paint: {
      'fill-color': '#3b82f6', // Blue color
      'fill-opacity': 0.3,
    },
  })

  // Add the outline layer
  map.addLayer({
    id: `${PARK_HIGHLIGHT_LAYER_ID}-outline`,
    type: 'line',
    source: PARK_HIGHLIGHT_SOURCE_ID,
    paint: {
      'line-color': '#3b82f6',
      'line-width': 2,
      'line-opacity': 0.8,
    },
  })
}

/**
 * Clear the park boundary highlight from the map
 *
 * @param map - The mapbox map instance (can be null)
 */
export function clearParkHighlight(map: mapboxgl.Map | null): void {
  if (!map) {
    return
  }

  // Remove layers
  if (map.getLayer(PARK_HIGHLIGHT_LAYER_ID)) {
    map.removeLayer(PARK_HIGHLIGHT_LAYER_ID)
  }
  if (map.getLayer(`${PARK_HIGHLIGHT_LAYER_ID}-outline`)) {
    map.removeLayer(`${PARK_HIGHLIGHT_LAYER_ID}-outline`)
  }

  // Remove source
  if (map.getSource(PARK_HIGHLIGHT_SOURCE_ID)) {
    map.removeSource(PARK_HIGHLIGHT_SOURCE_ID)
  }
}

/**
 * Calculate bounding box from GeoJSON geometry
 *
 * @param geometry - GeoJSON geometry (Polygon or MultiPolygon)
 * @returns Bounding box object with w, s, e, n coordinates, or null if invalid
 */
export function getBoundingBoxFromGeometry(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): BoundingBoxFeature | null {
  if (!geometry || (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon')) {
    return null
  }

  try {
    const feature: GeoJSON.Feature = {
      type: 'Feature',
      geometry: geometry,
      properties: {},
    }

    // Calculate bounding box using turf
    // bbox returns [minX, minY, maxX, maxY] = [west, south, east, north]
    const [w, s, e, n] = bbox(feature)

    return {
      w,
      s,
      e,
      n,
    }
  } catch (error) {
    console.warn('getBoundingBoxFromGeometry: Failed to calculate bounding box', error)
    return null
  }
}
