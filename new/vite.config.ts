import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3001, // Different from admin app
    host: true,
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
            // Group other vendor libraries
            return 'vendor'
          }
        },
      },
    },
  },
  define: {
    // Make environment variables available
    'process.env': process.env,
  },
})