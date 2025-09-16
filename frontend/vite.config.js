import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

// Enable HTTPS only if explicitly requested and cert files exist.
const enableHttps = process.env.VITE_ENABLE_HTTPS === '1'
let httpsConfig = false
if (enableHttps) {
  const keyPath = path.resolve('./key.pem')
  const certPath = path.resolve('./cert.pem')
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    httpsConfig = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    }
    console.log('[vite] HTTPS enabled (VITE_ENABLE_HTTPS=1)')
  } else {
    console.warn('[vite] VITE_ENABLE_HTTPS=1 set but key.pem or cert.pem missing; falling back to HTTP')
  }
}

export default defineConfig({
  server: {
    https: httpsConfig,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false
      }
    }
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'Visions',
        short_name: 'Visions',
        description: 'A Progressive Web App built with Vite',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'fullscreen',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/app-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/app-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/app-icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
