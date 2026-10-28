import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // « @/ » : le dossier src (des imports qui ne dépendent pas de l'endroit où l'on est)
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // les pages : le site, et celles du carnet : son sommaire (/labo), Murmuration (servie à l'adresse /murmuration),
  // Fourrure (/fourrure), Yaya (/yaya), Toupies (/toupies), Feu d'artifice (/feu), Escalade (/escalade) et Abyme (/abyme)
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        labo: fileURLToPath(new URL('./labo/index.html', import.meta.url)),
        murmuration: fileURLToPath(new URL('./murmuration/index.html', import.meta.url)),
        fourrure: fileURLToPath(new URL('./fourrure/index.html', import.meta.url)),
        yaya: fileURLToPath(new URL('./yaya/index.html', import.meta.url)),
        abyme: fileURLToPath(new URL('./abyme/index.html', import.meta.url)),
        toupies: fileURLToPath(new URL('./toupies/index.html', import.meta.url)),
        feu: fileURLToPath(new URL('./feu/index.html', import.meta.url)),
        escalade: fileURLToPath(new URL('./escalade/index.html', import.meta.url)),
      },
    },
  },
})
