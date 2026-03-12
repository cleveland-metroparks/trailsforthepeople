import axios from 'axios'
import type {
  ApiResponse,
  Reservation,
  Attraction,
  Activity,
  Trail,
  Category,
  TransformedAttraction,
  TransformedTrail,
  ReservationBoundary,
  BoundaryApiResponse,
  DirectionsResult,
  DirectionsApiResponse,
} from '../types/api'
import {
  transformAttraction,
  transformTrail,
  transformActivity,
} from './dataTransform'

// API client configuration
const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_MAPS_API_BASE_URL || 'https://maps-api.clevelandmetroparks.com'}/${import.meta.env.VITE_MAPS_API_BASE_PATH || 'api/v1'}/`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for adding auth tokens if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add any authentication headers here if needed
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

/**
 * Fetch reservations (parks) from the API
 */
export async function getReservations(): Promise<Reservation[]> {
  const response = await apiClient.get<ApiResponse<Reservation>>('reservations')
  return response.data.data
}

/**
 * Fetch attractions from the API and transform them
 */
export async function getAttractions(): Promise<TransformedAttraction[]> {
  const response = await apiClient.get<ApiResponse<Attraction>>('attractions')
  return response.data.data.map(transformAttraction)
}

/**
 * Fetch activities from the API and transform them (add icons)
 */
export async function getActivities(): Promise<(Activity & { icon: string | null })[]> {
  const response = await apiClient.get<ApiResponse<Activity>>('activities')
  return response.data.data.map(transformActivity)
}

/**
 * Fetch trails from the API and transform them
 * Filters out unpublished trails (status === 0)
 */
export async function getTrails(): Promise<TransformedTrail[]> {
  const response = await apiClient.get<ApiResponse<Trail>>('trails')
  return response.data.data
    .filter((trail) => trail.status !== 0) // Skip unpublished trails
    .map(transformTrail)
}

/**
 * Fetch categories from the API
 */
export async function getCategories(): Promise<Category[]> {
  const response = await apiClient.get<ApiResponse<Category>>('categories')
  return response.data.data
}

/**
 * Fetch reservation boundaries from the API
 */
export async function getReservationBoundaries(): Promise<ReservationBoundary[]> {
  const response = await apiClient.get<BoundaryApiResponse>('reservation_boundaries')
  return response.data.data
}

/**
 * Trail geometry API response
 */
interface TrailGeometryResponse {
  data: {
    geom_geojson: string // JSON string that needs to be parsed
  }
}

/**
 * Trail profile API response (elevation profile)
 */
interface TrailProfileResponse {
  data: {
    elevation_profile: Array<{ x: number; y: number }>
  }
}

/**
 * Fetch trail geometry from the API
 * @param trailId - The ID of the trail
 * @returns Parsed GeoJSON geometry (LineString or MultiLineString)
 */
export async function getTrailGeometry(trailId: number): Promise<GeoJSON.LineString | GeoJSON.MultiLineString | null> {
  try {
    const response = await apiClient.get<TrailGeometryResponse>(`trail_geometries/${trailId}`)
    if (response.data.data.geom_geojson) {
      return JSON.parse(response.data.data.geom_geojson)
    }
    return null
  } catch (error) {
    console.error('Error fetching trail geometry:', error)
    return null
  }
}

/**
 * Fetch trail elevation profile from the API
 * @param trailId - The ID of the trail
 * @returns Array of { x: distance in feet, y: elevation in feet } or null
 */
export async function getTrailProfile(trailId: number): Promise<Array<{ x: number; y: number }> | null> {
  try {
    const response = await apiClient.get<TrailProfileResponse>(`trail_profiles/${trailId}`)
    const profile = response.data.data?.elevation_profile
    if (profile && Array.isArray(profile) && profile.length >= 2) {
      return profile
    }
    return null
  } catch (error) {
    console.error('Error fetching trail profile:', error)
    return null
  }
}

/**
 * Geocode result from API
 */
export interface GeocodeResult {
  title: string
  lat: number
  lng: number
  w?: number | null
  s?: number | null
  e?: number | null
  n?: number | null
}

/**
 * Geocode API response
 */
interface GeocodeApiResponse {
  data: GeocodeResult
}

/**
 * Geocode an address string
 *
 * @param address - Address or location string to geocode
 * @returns Geocode result with coordinates and title
 * @throws Error if geocoding fails
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!address.trim()) {
    throw new Error('Address cannot be empty')
  }

  try {
    const response = await apiClient.get<GeocodeApiResponse>(`geocode/${encodeURIComponent(address)}`)
    if (!response.data.data) {
      throw new Error('No geocoding results found')
    }
    return response.data.data
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error && (error as { response?: { status?: number } }).response?.status === 404) {
      throw new Error("We couldn't find that address or city. Please try again.")
    }
    console.error('Geocoding error:', error)
    throw new Error('Failed to geocode address. Please try again.')
  }
}

/**
 * Directions request parameters
 */
interface DirectionsParams {
  sourcelat: number
  sourcelng: number
  targetlat: number
  targetlng: number
  via?: string
}

/**
 * Get directions between two points.
 *
 * Routes to the appropriate API endpoint based on transport mode:
 * - 'car' → directions_driving (Bing)
 * - 'bus' → directions_transit (Bing)
 * - 'hike', 'bike' → directions_trails (internal)
 */
export async function getDirections(
  sourceLat: number,
  sourceLng: number,
  targetLat: number,
  targetLng: number,
  via: string
): Promise<DirectionsResult> {
  const params: DirectionsParams = {
    sourcelat: sourceLat,
    sourcelng: sourceLng,
    targetlat: targetLat,
    targetlng: targetLng,
  }

  let endpoint: string

  switch (via) {
    case 'car':
      endpoint = 'directions_driving'
      break
    case 'bus':
      endpoint = 'directions_transit'
      break
    default:
      endpoint = 'directions_trails'
      params.via = via
      break
  }

  try {
    const response = await apiClient.get<DirectionsApiResponse>(endpoint, { params })
    return response.data.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data && typeof (error.response.data as { message?: unknown }).message === 'string') {
      throw new Error((error.response.data as { message: string }).message)
    }
    throw error
  }
}

/**
 * Get walking or cycling directions from Mapbox Directions API.
 * Used as fallback when native trail routing fails or endpoints span parks.
 */
export async function getMapboxDirections(
  sourceLat: number,
  sourceLng: number,
  targetLat: number,
  targetLng: number,
  via: 'hike' | 'bike',
  token: string
): Promise<DirectionsResult> {
  const profile = via === 'bike' ? 'cycling' : 'walking'
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${sourceLng},${sourceLat};${targetLng},${targetLat}?geometries=geojson&steps=true&access_token=${token}`

  const response = await axios.get<{
    routes: Array<{
      distance: number
      duration: number
      geometry: { coordinates: Array<[number, number]> }
      legs: Array<{
        steps: Array<{
          maneuver: { instruction: string }
          distance: number
          duration: number
        }>
      }>
    }>
    waypoints: Array<{ location: [number, number] }>
  }>(url)

  const route = response.data.routes[0]
  const waypoints = response.data.waypoints
  const coords = route.geometry.coordinates

  // Build WKT LINESTRING
  const wkt = `LINESTRING (${coords.map(([lng, lat]) => `${lng} ${lat}`).join(', ')})`

  // Compute bounds from coordinates
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity
  for (const [lng, lat] of coords) {
    if (lng < west) west = lng
    if (lat < south) south = lat
    if (lng > east) east = lng
    if (lat > north) north = lat
  }

  const startWp = waypoints[0].location
  const endWp = waypoints[1].location

  // Format steps
  const steps = route.legs[0].steps.map((step) => {
    const distMiles = step.distance * 0.000621371
    const distText = distMiles < 0.1
      ? `${Math.round(step.distance * 3.28084)} ft`
      : `${distMiles.toFixed(1)} mi`
    const durMin = Math.round(step.duration / 60)
    const durText = durMin < 1 ? 'Less than 1 min' : `${durMin} min`
    return {
      text: step.maneuver.instruction,
      distance: distText,
      duration: durText,
    }
  })

  // Format totals
  const totalMiles = route.distance * 0.000621371
  const totalDistText = totalMiles < 0.1
    ? `${Math.round(route.distance * 3.28084)} ft`
    : `${totalMiles.toFixed(1)} mi`
  const totalSecs = Math.round(route.duration)
  const totalHours = Math.floor(totalSecs / 3600)
  const totalMins = Math.round((totalSecs % 3600) / 60)
  const totalDurText = totalHours > 0
    ? `${totalHours}:${String(totalMins).padStart(2, '0')}`
    : `${totalMins} min`

  return {
    start: { lat: startWp[1], lng: startWp[0] },
    end: { lat: endWp[1], lng: endWp[0] },
    wkt,
    bounds: { west, south, east, north },
    steps,
    totals: { distance: totalDistText, duration: totalDurText },
  }
}

export { apiClient }
