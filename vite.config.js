import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy all /api/* calls to FastAPI dashboard backend
      '/api': {
        target: 'https://ai-hire-one.vercel.app',
        changeOrigin: true,
      },
    },
  },
})
