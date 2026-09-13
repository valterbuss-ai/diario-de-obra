import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Diário de Obra',
        short_name: 'Diário de Obra',
        description: 'Registro diário de serviços de campo — equipe, carga, local e fotos.',
        lang: 'pt-BR',
        theme_color: '#0f1115',
        background_color: '#0f1115',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // App shell (HTML/JS/CSS) em cache pra abrir rápido e tolerar rede
        // instável. Dados da API e fotos NUNCA ficam em cache — sempre rede,
        // pra nunca mostrar informação desatualizada pro operador.
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/uploads\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
