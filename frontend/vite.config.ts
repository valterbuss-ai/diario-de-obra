import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Identifica a versão publicada, para dar pra conferir num olhar se o aparelho já
// pegou a atualização (antes, a única forma era inspecionar o bundle). No Render a
// variável RENDER_GIT_COMMIT existe; no computador, cai no git; se nada funcionar,
// a data do build sozinha já resolve.
function versaoDoApp() {
  const data = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  let commit = (process.env.RENDER_GIT_COMMIT ?? '').slice(0, 7)
  if (!commit) {
    try {
      commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    } catch {
      commit = ''
    }
  }
  return commit ? `${data} · ${commit}` : data
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __VERSAO_APP__: JSON.stringify(versaoDoApp()),
  },
  plugins: [
    react(),
    VitePWA({
      // 'prompt' (e não 'autoUpdate') porque quem decide a hora de aplicar é o
      // componente AtualizacaoDoApp: no 'autoUpdate' o plugin recarrega a página
      // sozinho, inclusive no meio de um registro, e o operador perderia em campo
      // o que já tinha digitado. O componente aplica sozinho quando não há nada em
      // andamento, e só nesse caso.
      registerType: 'prompt',
      // O registro é feito no código (componente AtualizacaoDoApp), não por um
      // script injetado: o script padrão só registrava o service worker e nunca
      // recarregava a página, então a versão nova ficava baixada mas sem entrar.
      injectRegister: null,
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
        // Assume a página já na primeira visita, para o app funcionar offline sem
        // precisar de um segundo carregamento. Não força troca de versão: quem
        // troca é o skipWaiting, que no modo 'prompt' só acontece sob comando.
        clientsClaim: true,
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
