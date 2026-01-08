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
} from '../types/api'
import {
  transformAttraction,
  transformTrail,
  transformActivity,
} from './dataTransform'

// API client configuration
const apiClient = axios.create({
  baseURL: 'https://maps-api.clevelandmetroparks.com/api/v1/',
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

export { apiClient }
