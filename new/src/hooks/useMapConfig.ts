import { useMemo } from 'react'

// Mapbox styles (baselayers)
const STYLE_LAYER_MAP = import.meta.env.VITE_MAPBOX_MAP_STYLE_URL || 'mapbox://styles/cleveland-metroparks/cmcm7iiwp00af01qvf4i1afbb'
const STYLE_LAYER_PHOTO = import.meta.env.VITE_MAPBOX_PHOTO_STYLE_URL || 'mapbox://styles/cleveland-metroparks/cjcutetjg07892ro6wunp2da9'

const MAP_CONFIG = {
  accessToken: import.meta.env.VITE_MAPBOX_TOKEN || '',

  // Style layers
  styleLayer: STYLE_LAYER_MAP, // Default style
  styleLayers: {
    map: STYLE_LAYER_MAP,
    photo: STYLE_LAYER_PHOTO,
  } as Record<string, string>,

  startCenter: [-81.6730, 41.3953] as [number, number],
  startZoom: 11,
  mobileStartZoom: 9,

  maxBounds: {
    sw: [-82.08504, 41.11816] as [number, number],
    ne: [-81.28029, 41.70009] as [number, number],
  },

  mapsApiBaseUrl: `${import.meta.env.VITE_MAPS_API_BASE_URL || 'https://maps-api.clevelandmetroparks.com'}/${import.meta.env.VITE_MAPS_API_BASE_PATH || 'api/v1'}/`,
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
