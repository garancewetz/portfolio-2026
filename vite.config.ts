import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // « @/ » : le dossier src (des imports qui ne dépendent pas de l'endroit où l'on est)
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // les pages : le site, et celles du carnet : Murmuration (servie à l'adresse /murmuration) et
  // Fourrure (/fourrure)
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        murmuration: fileURLToPath(new URL('./murmuration/index.html', import.meta.url)),
        fourrure: fileURLToPath(new URL('./fourrure/index.html', import.meta.url)),
      },
    },
  },
})
