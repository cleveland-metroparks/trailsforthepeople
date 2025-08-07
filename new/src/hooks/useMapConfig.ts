import { useMemo } from 'react'

const MAP_CONFIG = {
  accessToken: import.meta.env.VITE_MAPBOX_TOKEN || '',
  styleLayer: import.meta.env.VITE_MAPBOX_STYLE_URL || 'mapbox://styles/mapbox/streets-v12',

  startCenter: [-81.6730, 41.3953] as [number, number],
  startZoom: 11,

  maxBounds: {
    sw: [-82.08504, 41.11816] as [number, number],
    ne: [-81.28029, 41.70009] as [number, number],
  },

  mapsApiBaseUrl: 'https://maps-api.clevelandmetroparks.com/api/v1/',
}

export function useMapConfig() {
  const mapConfig = useMemo(() => {
    // Validate that we have the required token
    if (!MAP_CONFIG.accessToken) {
      console.error('Mapbox access token is missing. Please check your environment variables.')
    }

    return MAP_CONFIG
  }, [])

  return { mapConfig }
}
