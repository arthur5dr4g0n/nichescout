import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { researchProxy } from './vite.proxy.js'

// We keep the REACT_APP_ prefix so the .env flags from the spec
// (REACT_APP_USE_MOCK, REACT_APP_RAPIDAPI_KEY, ...) are exposed to the app.
// Access them in code via import.meta.env.REACT_APP_*
export default defineConfig({
  plugins: [react(), researchProxy()],
  envPrefix: 'REACT_APP_',
  server: {
    port: 5173,
    open: false,
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
})
