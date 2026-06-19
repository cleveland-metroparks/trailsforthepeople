import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

// Local-dev hostname used to serve the admin as a same-site subdomain of the
// API (both under clevelandmetroparks.com), so Sanctum's session/XSRF cookies
// are first-party. Add this host to /etc/hosts (→ 127.0.0.1) and generate a
// trusted cert into ./certs with mkcert (see README/setup notes).
const LOCAL_HOST = 'maps-admin-local.clevelandmetroparks.com'
const certPath = fileURLToPath(new URL(`./certs/${LOCAL_HOST}.pem`, import.meta.url))
const keyPath = fileURLToPath(new URL(`./certs/${LOCAL_HOST}-key.pem`, import.meta.url))
// HTTPS is enabled only when the cert pair exists, so a missing cert never
// breaks `npm start` for anyone who hasn't run the mkcert setup.
const localHttps =
  fs.existsSync(certPath) && fs.existsSync(keyPath)
    ? { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
    : undefined

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
      // Allow the custom same-site dev hostname (Vite blocks unknown hosts by
      // default). localhost still works for the proxy-less default flow.
      allowedHosts: [LOCAL_HOST],
      ...(localHttps ? { https: localHttps } : {}),
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
