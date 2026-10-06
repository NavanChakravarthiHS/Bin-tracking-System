import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function apiConfigPlugin(apiBase) {
  const source = `window.ECOTRACK_API_BASE_URL = ${JSON.stringify(apiBase)};\n`
  return {
    name: 'ecotrack-api-config',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url === '/api-config.js') {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
          res.end(source)
          return
        }
        next()
      })
    },
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist')
      fs.mkdirSync(outDir, { recursive: true })
      fs.writeFileSync(path.join(outDir, 'api-config.js'), source)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = String(env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
  const backendTarget = env.VITE_DEV_BACKEND_URL || 'http://localhost:5000'

  return {
    plugins: [react(), apiConfigPlugin(apiBase)],
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          app: path.resolve(__dirname, 'app.html'),
        },
      },
    },
    server: {
      proxy: {
        '^/admin/': backendTarget,
        '^/collector/': backendTarget,
        '/health': backendTarget,
        '/iot': backendTarget,
        '/internal': backendTarget,
      },
    },
    preview: {
      proxy: {
        '^/admin/': backendTarget,
        '^/collector/': backendTarget,
        '/health': backendTarget,
        '/iot': backendTarget,
        '/internal': backendTarget,
      },
    },
  }
})
