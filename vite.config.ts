import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 'base: ./' is CRITICAL for GitHub Pages to find files
  base: './',
  define: {
    // This safely exposes the API_KEY process environment variable to the browser
    'process.env': {
      API_KEY: process.env.API_KEY
    }
  },
  server: {
    port: 3000
  }
})