import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // Avoid Windows EBUSY watchers leaving newly created scene files stale.
      usePolling: process.platform === 'win32',
      interval: 250,
      ignored: ['**/artifacts/**', '**/test-results/**'],
    },
  },
})
