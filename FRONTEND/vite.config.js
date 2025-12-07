import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Error Manager',
        short_name: 'Errors',
        theme_color: '#0f172a',
        background_color: '#0b1220',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      // CAP
      '/odata': {
        target: process.env.VITE_API_BASE || 'http://localhost:3333',
        changeOrigin: true
      },
      '/health': {
        target: process.env.VITE_API_BASE || 'http://localhost:3333',
        changeOrigin: true
      },
    }
  }
})
