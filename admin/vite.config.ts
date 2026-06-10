import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // VITE_SKIP_LOGIN bypasses auth entirely (disables withCredentials and
  // synthesizes a fake user). It's a local-dev convenience and must never be
  // baked into a production bundle — fail the build hard if it ever is.
  const env = loadEnv(mode, process.cwd(), '')
  const skipLogin = (env.VITE_SKIP_LOGIN || '').toLowerCase() === 'true'
  if (command === 'build' && skipLogin) {
    throw new Error(
      'VITE_SKIP_LOGIN=true is set for a production build. This disables ' +
        'authentication and must never ship. Unset it before building.'
    )
  }

  return {
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
  }
})
