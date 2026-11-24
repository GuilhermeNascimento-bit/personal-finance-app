import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Caminhos relativos: o mesmo build funciona no GitHub Pages
  // (/personal-finance-app/), no Firebase Hosting e localmente.
  base: './',
})
