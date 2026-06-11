import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_TARGET = 'https://slyce-b2bmh0gzajd8fufu.westeurope-01.azurewebsites.net'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
        // Rewrite the cookie domain so the browser stores it for localhost
        cookieDomainRewrite: 'localhost',
      },
    },
  },
})
