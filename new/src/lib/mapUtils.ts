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
  /** Padding in pixels for bounding box fits (default: 10). Can be a number for uniform padding or an object with top, bottom, left, right properties. */
  padding?: number | { top?: number; bottom?: number; left?: number; right?: number }
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
 * Only checks that all coordinates are valid numbers, not their ordering
 * (coordinates may be swapped and will be corrected in zoomToFeature)
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
    !isNaN(bbox.n)
    // Note: We don't check ordering (w < e or s < n) because coordinates
    // might be swapped in the data. We'll handle that in zoomToFeature.
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
      // Ensure proper ordering (handle swapped coordinates)
      // West should be less than East, South should be less than North
      const west = Math.min(feature.w, feature.e)
      const east = Math.max(feature.w, feature.e)
      const south = Math.min(feature.s, feature.n)
      const north = Math.max(feature.s, feature.n)
      
      const sw = new mapboxgl.LngLat(west, south)
      const ne = new mapboxgl.LngLat(east, north)
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

// Constants for trail highlight layer
const TRAIL_HIGHLIGHT_SOURCE_ID = 'trail-highlight-source'
const TRAIL_HIGHLIGHT_LAYER_ID = 'trail-highlight-layer'

// Version counter to invalidate stale highlight operations (handles race conditions
// when user clicks trails faster than style.load can complete)
let trailHighlightVersion = 0

// Track fade-out timeout to allow cancellation
let parkHighlightFadeOutTimeout: ReturnType<typeof setTimeout> | null = null
let parkHighlightFadeOutAnimationFrame: number | null = null

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

  // Cancel any existing fade-out
  if (parkHighlightFadeOutTimeout !== null) {
    clearTimeout(parkHighlightFadeOutTimeout)
    parkHighlightFadeOutTimeout = null
  }
  if (parkHighlightFadeOutAnimationFrame !== null) {
    cancelAnimationFrame(parkHighlightFadeOutAnimationFrame)
    parkHighlightFadeOutAnimationFrame = null
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
      'fill-color': '#6AB03E', // green_light
      'fill-opacity': 0.3,
    },
  })

  // Add the outline layer
  map.addLayer({
    id: `${PARK_HIGHLIGHT_LAYER_ID}-outline`,
    type: 'line',
    source: PARK_HIGHLIGHT_SOURCE_ID,
    paint: {
      'line-color': '#1D5C1F', // green_dark
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
  if (!map || !map.isStyleLoaded()) {
    return
  }

  // Cancel any ongoing fade-out animations
  if (parkHighlightFadeOutTimeout !== null) {
    clearTimeout(parkHighlightFadeOutTimeout)
    parkHighlightFadeOutTimeout = null
  }
  if (parkHighlightFadeOutAnimationFrame !== null) {
    cancelAnimationFrame(parkHighlightFadeOutAnimationFrame)
    parkHighlightFadeOutAnimationFrame = null
  }

  // Remove layers (check if they exist first)
  try {
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
  } catch (error) {
    // Map might be in a state where layers can't be accessed
    console.warn('clearParkHighlight: Error clearing highlight', error)
  }
}

/**
 * Fade out the park boundary highlight over a duration, then clear it
 *
 * @param map - The mapbox map instance (can be null)
 * @param duration - Duration of fade in milliseconds (default: 1000)
 * @param delay - Delay before starting fade in milliseconds (default: 0)
 */
export function fadeOutParkHighlight(
  map: mapboxgl.Map | null,
  duration: number = 1000,
  delay: number = 0
): void {
  if (!map) {
    return
  }

  // Cancel any existing fade-out
  if (parkHighlightFadeOutTimeout !== null) {
    clearTimeout(parkHighlightFadeOutTimeout)
    parkHighlightFadeOutTimeout = null
  }
  if (parkHighlightFadeOutAnimationFrame !== null) {
    cancelAnimationFrame(parkHighlightFadeOutAnimationFrame)
    parkHighlightFadeOutAnimationFrame = null
  }

  const fadeOut = () => {
    const fillLayer = map.getLayer(PARK_HIGHLIGHT_LAYER_ID)
    const outlineLayer = map.getLayer(`${PARK_HIGHLIGHT_LAYER_ID}-outline`)

    if (!fillLayer || !outlineLayer) {
      return
    }

    // Get initial opacity values
    const initialFillOpacity = 0.3
    const initialOutlineOpacity = 0.8

    const startTime = Date.now()
    const animate = () => {
      // Check if layers still exist (might have been cleared)
      if (!map.getLayer(PARK_HIGHLIGHT_LAYER_ID) || !map.getLayer(`${PARK_HIGHLIGHT_LAYER_ID}-outline`)) {
        parkHighlightFadeOutAnimationFrame = null
        return
      }

      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease out animation
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      const currentFillOpacity = initialFillOpacity * (1 - easeOut)
      const currentOutlineOpacity = initialOutlineOpacity * (1 - easeOut)

      map.setPaintProperty(PARK_HIGHLIGHT_LAYER_ID, 'fill-opacity', currentFillOpacity)
      map.setPaintProperty(`${PARK_HIGHLIGHT_LAYER_ID}-outline`, 'line-opacity', currentOutlineOpacity)

      if (progress < 1) {
        parkHighlightFadeOutAnimationFrame = requestAnimationFrame(animate)
      } else {
        // Clear after animation completes
        parkHighlightFadeOutAnimationFrame = null
        clearParkHighlight(map)
      }
    }

    parkHighlightFadeOutAnimationFrame = requestAnimationFrame(animate)
  }

  if (delay > 0) {
    parkHighlightFadeOutTimeout = setTimeout(fadeOut, delay)
  } else {
    fadeOut()
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

/**
 * Highlight a trail line on the map using GeoJSON geometry
 * Similar to drawHighlightLine() in mobile.js
 *
 * @param map - The mapbox map instance (can be null)
 * @param geometry - GeoJSON geometry (LineString or MultiLineString)
 */
export function highlightTrailLine(
  map: mapboxgl.Map | null,
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString
): void {
  if (!map) {
    return
  }

  if (!geometry || (geometry.type !== 'LineString' && geometry.type !== 'MultiLineString')) {
    return
  }

  // Increment version to mark this as the current highlight operation
  const thisVersion = ++trailHighlightVersion

  const feature: GeoJSON.Feature = {
    type: 'Feature',
    geometry: geometry,
    properties: {},
  }

  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [feature],
  }

  // Try to add the layer directly - isStyleLoaded() can return false even when
  // the map is usable, and in those cases style.load won't fire again
  const success = addTrailHighlightLayer(map, geojson)
  
  if (!success && !map.isStyleLoaded()) {
    // Only defer if the add actually failed AND style reports not loaded
    map.once('style.load', () => {
      // Only apply if this is still the current highlight operation
      if (trailHighlightVersion === thisVersion) {
        addTrailHighlightLayer(map, geojson)
      }
    })
  }
}

/**
 * Add or update the trail highlight layer on the map
 * Matches the styling from drawHighlightLine() in mobile.js:
 * - line-color: '#01B3FD'
 * - line-width: 6
 * - line-opacity: 0.75
 */
function addTrailHighlightLayer(map: mapboxgl.Map, geojson: GeoJSON.FeatureCollection): boolean {
  try {
    // Remove existing layer and source if they exist
    if (map.getLayer(TRAIL_HIGHLIGHT_LAYER_ID)) {
      map.removeLayer(TRAIL_HIGHLIGHT_LAYER_ID)
    }
    if (map.getSource(TRAIL_HIGHLIGHT_SOURCE_ID)) {
      map.removeSource(TRAIL_HIGHLIGHT_SOURCE_ID)
    }

    // Add the source
    map.addSource(TRAIL_HIGHLIGHT_SOURCE_ID, {
      type: 'geojson',
      data: geojson,
    })

    // Add the line layer
    map.addLayer({
      id: TRAIL_HIGHLIGHT_LAYER_ID,
      type: 'line',
      source: TRAIL_HIGHLIGHT_SOURCE_ID,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#01B3FD',
        'line-width': 6,
        'line-opacity': 0.75,
      },
    })
    
    return !!map.getLayer(TRAIL_HIGHLIGHT_LAYER_ID)
  } catch {
    return false
  }
}

/**
 * Clear the trail highlight line from the map
 *
 * @param map - The mapbox map instance (can be null)
 */
export function clearTrailHighlight(map: mapboxgl.Map | null): void {
  // Increment version to invalidate any pending highlight operations
  // (this must happen even if we can't clear the layer yet)
  trailHighlightVersion++

  if (!map || !map.isStyleLoaded()) {
    return
  }

  // Remove layer (check if it exists first)
  try {
    if (map.getLayer(TRAIL_HIGHLIGHT_LAYER_ID)) {
      map.removeLayer(TRAIL_HIGHLIGHT_LAYER_ID)
    }

    // Remove source
    if (map.getSource(TRAIL_HIGHLIGHT_SOURCE_ID)) {
      map.removeSource(TRAIL_HIGHLIGHT_SOURCE_ID)
    }
  } catch {
    // Map might be in a state where layers can't be accessed
  }
}
