import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // « @/ » : le dossier src (des imports qui ne dépendent pas de l'endroit où l'on est)
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
