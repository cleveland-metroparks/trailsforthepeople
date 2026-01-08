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
  [key: string]: unknown // Allow for additional fields
}

// Transformed Attraction (after processing)
export interface TransformedAttraction extends Omit<Attraction, 'categories' | 'activities'> {
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
  [key: string]: unknown // Allow for additional fields
}

// Category
export interface Category {
  categorytypeid: number
  name: string
  [key: string]: unknown // Allow for additional fields
}

// Transformed Trail (after processing)
export interface TransformedTrail extends Omit<Trail, 'bike' | 'hike' | 'bridle' | 'mountainbike'> {
  bike: boolean
  hike: boolean
  bridle: boolean
  mountainbike: boolean
}
