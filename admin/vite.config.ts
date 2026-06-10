import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/admin',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3001,
    host: true,
  },
  build: {
    outDir: 'dist',
    // Don't publish source maps with the production build — they expose the
    // full original TypeScript source to anyone who opens devtools on the
    // live admin. Use `vite build --sourcemap` locally when you need them.
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/mapbox-gl')) {
            return 'mapbox-gl'
          }
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/') ||
            id.includes('node_modules/@mantine/')
          ) {
            return 'react-vendor'
          }
        },
      },
    },
  },
})
