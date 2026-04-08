/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_MAPBOX_TOKEN: string
  readonly VITE_MAPBOX_MAP_STYLE_URL: string
  readonly VITE_MAPBOX_PHOTO_STYLE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
