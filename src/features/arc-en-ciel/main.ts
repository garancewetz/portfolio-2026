import './arc-en-ciel.css'
import { mount } from '@/features/carnet/carnet'
import { at, chroma, light, style } from './optique'

// Arc-en-ciel : une averse en caractères sur toute la page. La souris est le soleil ; l'arc-en-ciel apparaît dans la
// pluie, du côté opposé.
//
// L'horizon est le bas de la page et le point antisolaire est le reflet du soleil : à gauche si le soleil est à
// droite, et sous l'horizon d'autant que le soleil est au-dessus. Soleil bas : un grand arc, haut dans le ciel.
// Soleil qui monte : l'arc s'enfonce. Soleil plus haut que 42° : plus d'arc du tout (comme à midi).
// Les angles, les couleurs et les clartés du ciel viennent de l'optique (voir optique.ts). Ce sont les gouttes qui
// portent les couleurs : une goutte n'est colorée qu'au moment où elle traverse l'arc, et laisse un peu de bruine
// derrière elle.

const canvas = document.querySelector<HTMLCanvasElement>('.ac-sky')!
const ctx = canvas.getContext('2d')!

// la page : sa taille, la grille de caractères (largeur et hauteur d'une case, colonnes, rangées), et combien de
// pixels fait un degré de ciel (la hauteur de la page couvre 60°)
let W = 0
let H = 0
let cw = 0
let ch = 0
let cols = 0
let rows = 0
let deg = 0
// la bruine que laissent les gouttes dans l'arc : son intensité et sa couleur (une entrée de la table d'optique), case
// par case
let mist = new Float32Array(0)
let mistAt = new Int16Array(0)
// (un grain fixe par case, pour que la bruine ne scintille pas partout en même temps)
let grain = new Float32Array(0)

// les gouttes : leur colonne, la hauteur de leur tête (en pixels), leur vitesse (pixels par seconde), la longueur
// de leur traînée (en cases)
const DENSITY = 1.1 // (gouttes par colonne)
let dropCol = new Int16Array(0)
let dropY = new Float32Array(0)
let dropV = new Float32Array(0)
let dropLen = new Uint8Array(0)

function spawn(i: number, anywhere: boolean) {
  dropCol[i] = Math.floor(Math.random() * cols)
  dropY[i] = anywhere ? Math.random() * H * 1.2 : -Math.random() * H * 0.4
  dropV[i] = 520 + Math.random() * 420
  dropLen[i] = 3 + Math.floor(Math.random() * 5)
}

function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1)
  W = innerWidth
  H = innerHeight
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const size = W < 600 ? 11 : 14
  ctx.font = `${size}px 'JetBrains Mono', ui-monospace, monospace`
  ctx.textBaseline = 'top'
  cw = ctx.measureText('M').width
  ch = Math.round(size * 1.3)
  cols = Math.ceil(W / cw)
  rows = Math.ceil(H / ch)
  deg = H / 60
  mist = new Float32Array(cols * rows)
  mistAt = new Int16Array(cols * rows)
  grain = Float32Array.from({ length: cols * rows }, () => Math.random())
  const count = Math.round(cols * DENSITY)
  dropCol = new Int16Array(count)
  dropY = new Float32Array(count)
  dropV = new Float32Array(count)
  dropLen = new Uint8Array(count)
  for (let i = 0; i < count; i++) spawn(i, true)
}
addEventListener('resize', resize)
resize()
// (la police arrive après coup : on remesure les cases)
document.fonts?.ready.then(resize)

// le soleil : là où il est, et là où va la souris (il la suit avec un peu de douceur). Au départ, bas sur la
// gauche, pour qu'un arc soit déjà là
let sunX = W * 0.22
let sunY = H * 0.86
let moved = false
let toX = sunX
let toY = sunY
addEventListener('pointermove', (e) => {
  moved = true
  toX = e.clientX
  toY = e.clientY
})
addEventListener('pointerdown', (e) => {
  moved = true
  toX = e.clientX
  toY = e.clientY
})

const RAIN = 'rgb(186 196 214)'
const SUN = 'rgb(255 214 140)'

// où tombe une case par rapport à l'arc : son entrée dans la table, la part colorée de la lumière (ce qui colore
// les gouttes), et la clarté du ciel (plus clair sous l'arc, sombre dans la bande d'Alexandre)
let here = 0
let colour = 0
let skyLight = 1
function bow(theta: number) {
  here = at(theta)
  colour = light[here] * chroma[here]
  skyLight = 0.55 + 1.6 * Math.min(1, light[here])
}

// le soleil en caractères : un disque ombré, du plus dense au centre au plus léger au bord, et une couronne qui
// scintille
const SHADES = '.:-=+*#%@'

let last = performance.now()
function draw(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  const t = now / 1000

  // (tant que personne n'a bougé, le soleil reste bas sur la gauche, même si la page a changé de taille)
  if (!moved) {
    toX = sunX = W * 0.22
    toY = sunY = H * 0.86
  }
  const follow = 1 - Math.exp(-dt * 10)
  sunX += (toX - sunX) * follow
  sunY += (toY - sunY) * follow
  // le point antisolaire : le reflet du soleil (de l'autre côté, et sous l'horizon d'autant qu'il est au-dessus)
  const ax = W - sunX
  const ay = H + (H - sunY)
  const sunR = ch * 2.2

  ctx.clearRect(0, 0, W, H)

  // la bruine : dans l'arc, une poussière d'eau éclairée (quelques cases qui scintillent), et ce que les gouttes
  // y ont laissé en passant (qui s'efface en une seconde environ)
  const fade = Math.exp(-dt / 1)
  for (let r = 0; r < rows; r++) {
    const cy = r * ch + ch / 2
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const m = mist[i] * fade
      mist[i] = m
      bow(Math.hypot(c * cw + cw / 2 - ax, cy - ay) / deg)
      const twinkle = colour < 0.08 ? 0 : Math.min(1, colour * 1.4) * (0.5 + 0.5 * Math.sin(t * 0.9 + grain[i] * 40)) * 0.7
      const a = Math.max(m * 0.8, twinkle)
      if (a < 0.03) continue
      ctx.globalAlpha = a
      ctx.fillStyle = style[m * 0.8 > twinkle ? mistAt[i] : here]
      ctx.fillText('.', c * cw, r * ch)
    }
  }

  // la pluie
  for (let i = 0; i < dropY.length; i++) {
    dropY[i] += dropV[i] * dt
    const len = dropLen[i]
    if (dropY[i] - len * ch > H) spawn(i, false)
    const c = dropCol[i]
    const x = c * cw
    const cx = x + cw / 2
    const head = Math.floor(dropY[i] / ch)
    for (let k = 0; k < len; k++) {
      const r = head - k
      if (r < 0 || r >= rows) continue
      const cy = r * ch + ch / 2
      // (derrière le soleil, on ne voit pas la pluie)
      const ds = Math.hypot(cx - sunX, cy - sunY)
      if (ds < sunR) continue
      const b = 1 - k / len
      const sign = b > 0.6 ? '|' : b > 0.3 ? ':' : '.'
      bow(Math.hypot(cx - ax, cy - ay) / deg)
      if (colour > 0.08) {
        const strength = Math.min(1, colour * 1.4)
        ctx.globalAlpha = Math.min(1, b * (0.45 + strength))
        ctx.fillStyle = style[here]
        const cell = r * cols + c
        if (b * strength > mist[cell]) {
          mist[cell] = b * strength
          mistAt[cell] = here
        }
      } else {
        // (près du soleil, les gouttes s'éclairent de sa lumière)
        const near = Math.max(0, 1 - ds / (sunR * 5))
        ctx.globalAlpha = Math.min(1, b * 0.22 * skyLight + near * near * b * 0.7)
        ctx.fillStyle = near > 0.25 ? SUN : RAIN
      }
      ctx.fillText(sign, x, r * ch)
    }
  }

  // le soleil
  ctx.fillStyle = SUN
  const c0 = Math.floor((sunX - sunR * 2) / cw)
  const c1 = Math.ceil((sunX + sunR * 2) / cw)
  const r0 = Math.floor((sunY - sunR * 2) / ch)
  const r1 = Math.ceil((sunY + sunR * 2) / ch)
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const d = Math.hypot(c * cw + cw / 2 - sunX, r * ch + ch / 2 - sunY) / sunR
      if (d < 1) {
        ctx.globalAlpha = 1
        ctx.fillText(SHADES[Math.min(SHADES.length - 1, Math.floor((1 - d) * SHADES.length * 1.15))], c * cw, r * ch)
      } else if (d < 2) {
        const flicker = 0.5 + 0.5 * Math.sin(t * 2.3 + c * 1.7 + r * 2.9)
        ctx.globalAlpha = (2 - d) * 0.35 * flicker
        ctx.fillText('.', c * cw, r * ch)
      }
    }
  }
  ctx.globalAlpha = 1

  requestAnimationFrame(draw)
}
requestAnimationFrame(draw)

// la page dans le carnet (voir features/carnet)
mount()
