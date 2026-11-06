import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
// import vueDevTools from 'vite-plugin-vue-devtools'

function netlifyRedirects(apiUrl: string): Plugin {
  return {
    name: 'netlify-redirects',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: '_redirects',
        source: [`/api/*  ${apiUrl}/api/:splat  200`, `/*  /index.html  200`, ''].join('\n'),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const apiUrl = (env.API_URL ?? '').replace(/\/+$/, '')
  if (!apiUrl) throw new Error('API_URL не задан (см. .env)')

  return {
    plugins: [
      vue(),
      tailwindcss(),
      netlifyRedirects(apiUrl),
      // vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true,
      proxy: {
        '/api': { target: apiUrl, changeOrigin: true },
      },
    },
  }
})
