import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base must match the GitHub Pages repo name: https://<user>.github.io/devorbit/
export default defineConfig({
  base: '/devorbit/',
  plugins: [react()],
})
