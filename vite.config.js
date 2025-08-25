import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // permet d’écouter depuis l’extérieur
    port: 5173,
    allowedHosts: ['selfikiosk.duckdns.org'] // ajoute ton domaine ici
  }
})
