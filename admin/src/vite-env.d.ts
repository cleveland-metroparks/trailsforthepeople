/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_TOKEN: string
  readonly VITE_MAPBOX_STYLE_URL: string
  readonly VITE_MAPS_API_BASE_URL: string
  readonly VITE_MAPS_API_BASE_PATH: string
  readonly VITE_ROOT_PATH: string
  readonly VITE_MAP_DEFAULT_CENTER_LNG: string
  readonly VITE_MAP_DEFAULT_CENTER_LAT: string
  readonly VITE_MAP_DEFAULT_ZOOM: string
  readonly VITE_SKIP_LOGIN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
