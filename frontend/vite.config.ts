import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version?: string
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3002, // Different from admin app
    host: true,
    allowedHosts: ['.ngrok-free.app', '.ngrok.app', '.ngrok.io'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split mapbox-gl into its own chunk for better caching
          if (id.includes('node_modules')) {
            if (id.includes('mapbox-gl')) {
              return 'mapbox-gl'
            }
            // Keep React, Mantine, and Emotion together since they have tight dependencies
            // This avoids initialization order issues between React and Mantine hooks
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('use-sync-external-store') ||
              id.includes('scheduler') ||
              id.includes('@emotion') ||
              id.includes('@mantine') ||
              id.includes('create-use-external-events')
            ) {
              return 'react-vendor'
            }
            if (id.includes('@turf')) {
              return 'turf-vendor'
            }
            // Recharts has internal circular deps (Layer.js); keep it in its own chunk
            // to avoid "Cannot access 'E' before initialization" in production builds
            if (id.includes('recharts')) {
              return 'recharts'
            }
            // Group other vendor libraries
            return 'vendor'
          }
        },
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version ?? '0.0.0'),
  },
})
