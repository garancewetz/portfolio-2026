import './fourrure.css'
import { mount } from '@/features/carnet/carnet'
import { gear, slider, swatches } from '@/features/carnet/gear'
import { cover, load, RAMP, sample } from '@/features/carnet/photo'
import { raster } from '@/features/carnet/raster'
import { local, sheet } from '@/features/carnet/sheet'

// Fourrure : un chat gris de profil, en caractères très serrés, plongé dans le noir complet. La souris
// est la seule lumière : là où elle passe, le poil apparaît ; quand elle s'éloigne, la zone éclairée garde un peu
// de lumière, qui s'éteint lentement. On découvre le chat zone par zone, comme si on le peignait avec la lumière.
// La roue crantée (dans la ligne du carnet) règle la couleur du poil, la taille de la lumière (de la bougie à la
// lampe), et le temps que met une zone éclairée à retourner au noir.

// les couleurs du poil au choix, en dégradé : une couleur dans l'ombre, une autre dans la lumière (les yeux
// gardent la leur)
const COLOURS = [
  { name: 'gris', dark: [120, 126, 138], light: [222, 228, 238] },
  { name: 'lune', dark: [70, 96, 180], light: [236, 243, 255] },
  { name: 'braise', dark: [196, 52, 30], light: [255, 214, 110] },
  { name: 'or', dark: [160, 104, 36], light: [255, 228, 150] },
  { name: 'aube', dark: [130, 76, 200], light: [255, 184, 210] },
  { name: 'menthe', dark: [30, 130, 120], light: [190, 255, 226] },
]
// les réglages : la couleur, la taille de la lumière (son rayon, en pixels : de la bougie à la lampe), et en
// combien de secondes une zone éclairée s'éteint (à peu près)
const settings = { colour: 0, light: Math.max(90, Math.min(sheet().w, sheet().h) * 0.16), fade: 12 }

const canvas = document.querySelector<HTMLCanvasElement>('.cn-cat')!
const grid = raster(canvas, RAMP, () => (sheet().w < 600 ? 3 : 4))

// la photo (600 × 365) : le cadrage qui remplit la fenêtre ; sur un écran en hauteur (un téléphone), on cadre
// sur les pattes avant, de l'épaule au sol, plutôt qu'un morceau de ventre au milieu
const CROP: [number, number, number, number] = [10, 0, 540, 300]
const CROP_TALL: [number, number, number, number] = [140, 40, 190, 270]
// ce qui reste d'une zone éclairée quand la lumière s'en va
const AFTERGLOW = 0.55

let img: HTMLImageElement | null = null
// pour chaque case : la lumière du poil (0 à 1), sa couleur (celle du poil, ou celle de l'œil : eye), et combien
// elle est éclairée en ce moment (0 : dans le noir)
let glow = new Float32Array(0)
let tint = new Uint8ClampedArray(0)
let eye = new Uint8Array(0)
let lit = new Float32Array(0)
let dirty = true
// (des zones s'éteignent encore : on continue de dessiner)
let fading = false

function build() {
  grid.resize()
  if (!img) return
  const { W, H, cols, rows, cw, ch } = grid
  const px = sample(img, cover(W < H ? CROP_TALL : CROP, W, H), cols, rows, cw, ch)
  const n = cols * rows
  glow = new Float32Array(n)
  tint = new Uint8ClampedArray(n * 3)
  eye = new Uint8Array(n)
  lit = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const red = px[i * 4]
    const green = px[i * 4 + 1]
    const blue = px[i * 4 + 2]
    const l = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255
    glow[i] = Math.pow(Math.min(1, Math.max(0, (l - 0.05) / 0.5)), 0.85)
    // (l'œil, seule couleur de la photo, garde la sienne)
    if (Math.max(red, green, blue) - Math.min(red, green, blue) > 40) {
      eye[i] = 1
      tint.set([Math.min(255, red * 1.6), Math.min(255, green * 1.6), Math.min(255, blue * 1.2)], i * 3)
    }
  }
  dirty = true
}
load('/carnet/chat-gris.jpg').then((i) => {
  img = i
  build()
})
addEventListener('resize', build)
// (la police arrive après coup : on remesure les cases)
document.fonts?.ready.then(build)

// la lumière : là où est la souris (au départ, et quand elle quitte la page : nulle part)
let lightX = -1e5
let lightY = -1e5
addEventListener('pointermove', (e) => {
  ;({ x: lightX, y: lightY } = local(e))
  dirty = true
})
document.documentElement.addEventListener('pointerleave', () => {
  lightX = lightY = -1e5
  dirty = true
})

let last = performance.now()
function draw(now: number) {
  requestAnimationFrame(draw)
  const dt = Math.min(1 / 30, (now - last) / 1000)
  last = now
  // (rien ne change, souris immobile et plus rien qui s'éteint : rien à redessiner)
  if (!glow.length || (!dirty && !fading)) return
  dirty = false
  const { cols, rows, cw, ch } = grid
  // la lumière : un halo doux autour de la souris, de la taille choisie
  const radius = settings.light
  const fade = Math.exp(-dt / (settings.fade / 3))
  let still = false
  const lo = COLOURS[settings.colour].dark
  const hi = COLOURS[settings.colour].light

  for (let r = 0; r < rows; r++) {
    const y = r * ch + ch / 2
    const dy = (y - lightY) / radius
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const dx = (c * cw + cw / 2 - lightX) / radius
      const beam = Math.exp(-(dx * dx + dy * dy))
      // (ce qui a été éclairé garde un peu de lumière, qui s'éteint lentement)
      const mem = Math.max(lit[i] * fade, beam * AFTERGLOW)
      lit[i] = mem < 0.004 ? 0 : mem
      // (elle s'éteint encore : plus éclairée que ce que la lumière lui donne en ce moment)
      if (lit[i] > beam * AFTERGLOW + 0.004) still = true
      const g = Math.min(1, glow[i] * Math.max(beam * 1.3, lit[i]))
      if (g < 0.03) {
        grid.put(c, r, -1, 0, 0, 0)
        continue
      }
      // le caractère, plus dense là où le poil est plus clair ; la couleur, entre celle de l'ombre et celle de la
      // lumière (l'œil garde la sienne)
      const glyph = Math.round(g * (RAMP.length - 1))
      const alpha = 0.35 + 0.65 * g
      // (le dégradé penche vers la lumière : le poil est surtout dans l'ombre, il garderait sinon la seule couleur
      // sombre)
      const t = Math.sqrt(g)
      if (eye[i]) grid.put(c, r, glyph, tint[i * 3], tint[i * 3 + 1], tint[i * 3 + 2], alpha)
      else grid.put(c, r, glyph, lo[0] + (hi[0] - lo[0]) * t, lo[1] + (hi[1] - lo[1]) * t, lo[2] + (hi[2] - lo[2]) * t, alpha)
    }
  }
  fading = still
  grid.flush()
}
requestAnimationFrame(draw)

// (la lumière, dite en mots plutôt qu'en pixels)
const glowName = (n: number) => (n < 80 ? 'bougie' : n < 200 ? 'lanterne' : 'lampe')
// (une pastille : le dégradé de la couleur, de l'ombre à la lumière)
const gradient = (a: number[], b: number[]) => `linear-gradient(135deg, rgb(${a.join(' ')}), rgb(${b.join(' ')}))`

// la page dans le carnet (voir features/carnet), avec sa roue crantée
const nav = mount()
if (nav)
  gear(nav, 'Réglages de la fourrure', [
    swatches('couleur', COLOURS.map(({ name, dark, light }) => ({ name, css: gradient(dark, light) })), settings.colour, (k) => {
      settings.colour = k
      dirty = true
    }),
    slider('lumière', { min: 40, max: 420, step: 10, value: settings.light, show: glowName }, (n) => {
      settings.light = n
      dirty = true
    }),
    slider('extinction', { min: 1, max: 40, step: 1, value: settings.fade, show: (n) => `${n} s` }, (n) => {
      settings.fade = n
    }),
  ])
