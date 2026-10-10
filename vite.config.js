import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = (env.VITE_API_BASE_URL || 'https://ai-hire-chi.vercel.app').replace(/\/+$/, '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // Proxy all /api/* calls to the backend (VITE_API_BASE_URL)
        '/api': {
          target,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
