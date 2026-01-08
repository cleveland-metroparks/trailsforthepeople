import axios from 'axios'
import type {
  ApiResponse,
  Reservation,
  Attraction,
  Activity,
  Trail,
  TransformedAttraction,
  TransformedTrail,
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

export { apiClient }
