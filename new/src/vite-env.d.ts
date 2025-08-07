/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_TOKEN: string
  readonly VITE_MAPBOX_STYLE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
