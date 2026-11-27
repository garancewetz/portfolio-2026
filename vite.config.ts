import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

// the lab is the home page itself: /lab/ is served index.html, as Netlify does (netlify.toml), in dev and preview
const labPage = (): Plugin => {
  const rewrite = (req: { url?: string }, _res: unknown, next: () => void) => {
    if (req.url && /^\/lab\/?(\?.*)?$/.test(req.url)) req.url = '/index.html'
    next()
  }
  return {
    name: 'lab-page',
    configureServer: (server) => void server.middlewares.use(rewrite),
    configurePreviewServer: (server) => void server.middlewares.use(rewrite),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [labPage()],
  // « @/ »: the src folder (imports that do not depend on where you are)
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // the pages: the site (its lab: /lab/, in the home page itself), Kit (/kit), and the lab's experiments, under /lab/
  // in English: Murmuration, Yaya, Toupies (spinning-tops), Feu d'artifice (fireworks), Escalade (climbing), Ruban
  // (ribbon), Morse, Créatures (creatures), Mascottes (mascots), Jeux (games) and Abyme
  build: {
    // (three.js alone, shared by the 3D pages, weighs a little over 500 kB: expected)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        murmuration: fileURLToPath(new URL('./lab/murmuration/index.html', import.meta.url)),
        yaya: fileURLToPath(new URL('./lab/yaya/index.html', import.meta.url)),
        abyme: fileURLToPath(new URL('./lab/abyme/index.html', import.meta.url)),
        spinningtops: fileURLToPath(new URL('./lab/spinning-tops/index.html', import.meta.url)),
        fireworks: fileURLToPath(new URL('./lab/fireworks/index.html', import.meta.url)),
        climbing: fileURLToPath(new URL('./lab/climbing/index.html', import.meta.url)),
        ribbon: fileURLToPath(new URL('./lab/ribbon/index.html', import.meta.url)),
        morse: fileURLToPath(new URL('./lab/morse/index.html', import.meta.url)),
        creatures: fileURLToPath(new URL('./lab/creatures/index.html', import.meta.url)),
        kit: fileURLToPath(new URL('./kit/index.html', import.meta.url)),
        mascots: fileURLToPath(new URL('./lab/mascots/index.html', import.meta.url)),
        games: fileURLToPath(new URL('./lab/games/index.html', import.meta.url)),
      },
    },
  },
})
