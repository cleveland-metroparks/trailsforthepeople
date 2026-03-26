// API Response wrapper
export interface ApiResponse<T> {
  data: T[]
}

// Reservation (Parks)
export interface Reservation {
  record_id: string | number
  pagetitle: string
  boxw?: number | null
  boxs?: number | null
  boxe?: number | null
  boxn?: number | null
  latitude: number
  longitude: number
  drivingdestinationlatitude?: number | null
  drivingdestinationlongitude?: number | null
  pagethumbnail?: string | null
  descr?: string | null
  hoursofoperation?: string | null
  phone?: string | null
  [key: string]: unknown // Allow for additional fields
}

// Attraction
export interface Attraction {
  gis_id?: string | number | null
  record_id?: string | number | null
  pagetitle: string
  latitude: number
  longitude: number
  drivingdestinationlatitude?: number | null
  drivingdestinationlongitude?: number | null
  categories?: string | number[] | null // Can be pipe-delimited string or array after transformation
  activities?: string | number[] | null // Can be pipe-delimited string or array after transformation
  pagethumbnail?: string | null
  descr?: string | null
  hoursofoperation?: string | null
  phone?: string | null
  cmp_url?: string | null
  [key: string]: unknown // Allow for additional fields
}

// Transformed Attraction (after processing)
// Note: fields from Attraction are re-declared here because Omit<T, K> on a type
// with [key: string]: unknown loses specific property types (TypeScript limitation).
export interface TransformedAttraction extends Omit<Attraction, 'categories' | 'activities'> {
  pagetitle: string
  latitude: number
  longitude: number
  pagethumbnail?: string | null
  descr?: string | null
  hoursofoperation?: string | null
  phone?: string | null
  cmp_url?: string | null
  categories: number[] | null
  activities: number[] | null
}

// Activity
export interface Activity {
  eventactivitytypeid: number
  pagetitle: string
  icon?: string | null // Added during transformation
  [key: string]: unknown // Allow for additional fields
}

// Trail
export interface Trail {
  id: number
  name: string
  status: number
  lat: number
  lng: number
  boxw?: number | null
  boxs?: number | null
  boxe?: number | null
  boxn?: number | null
  bike?: string | boolean // Can be string "Yes"/"No" or boolean after transformation
  hike?: string | boolean
  bridle?: string | boolean
  mountainbike?: string | boolean
  distancetext?: string | null
  durationtext_hike?: string | null
  durationtext_bike?: string | null
  durationtext_bridle?: string | null
  description?: string | null
  [key: string]: unknown // Allow for additional fields
}

// Category
export interface Category {
  categorytypeid: number
  name: string
  [key: string]: unknown // Allow for additional fields
}

// Transformed Trail (after processing)
// Note: fields from Trail are re-declared here because Omit<T, K> on a type
// with [key: string]: unknown loses specific property types (TypeScript limitation).
export interface TransformedTrail extends Omit<Trail, 'bike' | 'hike' | 'bridle' | 'mountainbike'> {
  lat: number
  lng: number
  name: string
  boxw?: number | null
  boxs?: number | null
  boxe?: number | null
  boxn?: number | null
  distancetext?: string | null
  durationtext_hike?: string | null
  durationtext_bike?: string | null
  durationtext_bridle?: string | null
  description?: string | null
  bike: boolean
  hike: boolean
  bridle: boolean
  mountainbike: boolean
}

// Reservation Boundary
export interface ReservationBoundary {
  res_id: number
  res: string
  geom_geojson: string // Stringified GeoJSON that needs to be parsed
}

// API Response for boundaries (different structure)
export interface BoundaryApiResponse {
  success: boolean
  data: ReservationBoundary[]
}

// Directions step (individual turn-by-turn instruction)
export interface DirectionsStep {
  step_action?: string
  text: string
  distance?: string
  duration?: string
}

// Directions totals
export interface DirectionsTotals {
  distance: string
  duration: string
}

// Directions result from the API
export interface DirectionsResult {
  start: { lat: number; lng: number }
  end: { lat: number; lng: number }
  wkt: string
  bounds: { west: number; south: number; east: number; north: number }
  steps: DirectionsStep[]
  totals: DirectionsTotals
  retries?: number
  elevationprofile?: Array<{ x: number; y: number }>
}

// Directions API response wrapper
export interface DirectionsApiResponse {
  data: DirectionsResult
}
