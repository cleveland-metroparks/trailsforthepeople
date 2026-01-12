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
            // Split large vendor libraries into separate chunks
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            if (id.includes('@mantine')) {
              return 'mantine-vendor'
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