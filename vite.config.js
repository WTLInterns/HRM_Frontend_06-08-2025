import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    port: 3012, // or whatever port you use
    allowedHosts: ['admin.managifyhr.com'],
  },
})
