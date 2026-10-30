import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    // The backend serves /api. In Docker Compose it is reached by service name.
    proxy: {
      '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:8000',
    },
    // File change events don't reach containers from a Windows folder, so
    // Docker Compose turns on polling to keep hot reload working.
    watch: {
      usePolling: process.env.VITE_USE_POLLING === 'true',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
