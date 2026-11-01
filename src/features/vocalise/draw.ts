import { isBlack, noteName } from './pitch'

// Le dessin de Vocalise, dans le canvas : le ciel étoilé, les collines (deux rangées, la plus proche défile plus
// vite), le petit clavier de piano debout sur le bord gauche (la touche qu'on chante s'allume), le chemin de la
// voix, la lueur, et les notes à attraper. Tout est en caractères ou presque, à l'encre pâle sur la nuit.

const INK = '238 234 226'
const GOLD = '255 210 130'
const FONT = (px: number) => `${px}px 'JetBrains Mono', ui-monospace, monospace`

// (un nombre entre 0 et 1, toujours le même pour un même n : le décor ne change pas d'un passage à l'autre)
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

// le haut des collines, à l'abscisse x de l'écran (travelled : le chemin parcouru, en pixels)
export const backHill = (x: number, H: number, travelled: number) => {
  const w = x + travelled * 0.45
  return H * 0.8 + Math.sin(w * 0.0041) * H * 0.04 + Math.sin(w * 0.011 + 1) * H * 0.018
}
export const frontHill = (x: number, H: number, travelled: number) => {
  const w = x + travelled
  return H * 0.9 + Math.sin(w * 0.0057 + 2) * H * 0.03 + Math.sin(w * 0.017) * H * 0.012
}

// le ciel : des étoiles en caractères, qui défilent à peine, et scintillent
const STARS = ['.', '·', '·', '+', '*']
export function sky(g: CanvasRenderingContext2D, W: number, H: number, travelled: number, t: number) {
  g.font = FONT(11)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const n = Math.round((W * H) / 9000)
  for (let i = 0; i < n; i++) {
    const x = (((hash(i) * W * 1.5 - travelled * 0.03) % (W * 1.5)) + W * 1.5) % (W * 1.5)
    if (x > W) continue
    const y = hash(i + 0.5) ** 1.4 * H * 0.75
    const a = 0.18 + 0.32 * hash(i + 0.25) * (0.6 + 0.4 * Math.sin(t * (0.6 + hash(i + 0.75)) + i))
    g.fillStyle = `rgb(${INK} / ${a})`
    g.fillText(STARS[Math.floor(hash(i + 0.9) * STARS.length)], x, y)
  }
}

// les collines : la rangée du fond, pleine ; celle de devant, avec une herbe en caractères sur sa crête, et çà et
// là un petit arbre
const GRASS = [',', "'", '.', '`', ',', '.']
export function hills(g: CanvasRenderingContext2D, W: number, H: number, travelled: number) {
  const fill = (top: (x: number) => number, colour: string) => {
    g.beginPath()
    g.moveTo(0, H)
    for (let x = 0; x <= W + 8; x += 8) g.lineTo(x, top(x))
    g.lineTo(W, H)
    g.fillStyle = colour
    g.fill()
  }
  fill((x) => backHill(x, H, travelled), '#161a35')
  fill((x) => frontHill(x, H, travelled), '#1d2244')
  g.font = FONT(12)
  g.textAlign = 'center'
  g.textBaseline = 'bottom'
  const STEP = 9
  const first = Math.floor(travelled / STEP)
  for (let k = first; k * STEP - travelled < W + STEP; k++) {
    const x = k * STEP - travelled
    const y = frontHill(x, H, travelled) + 3
    const r = hash(k)
    if (r > 0.975) {
      g.fillStyle = `rgb(${INK} / 0.32)`
      g.font = FONT(20)
      g.fillText('↟', x, y)
      g.font = FONT(12)
    } else {
      g.fillStyle = `rgb(${INK} / ${0.1 + r * 0.16})`
      g.fillText(GRASS[Math.floor(r * GRASS.length)], x, y)
    }
  }
}

// le clavier, debout sur le bord gauche : un demi-ton par bande (les touches noires plus courtes), un trait léger
// à travers la page à chaque do, et son nom ; la touche chantée s'allume
export function keys(
  g: CanvasRenderingContext2D,
  W: number,
  lo: number,
  hi: number,
  yOf: (midi: number) => number,
  lit: number | null,
) {
  g.font = FONT(10)
  g.textAlign = 'left'
  g.textBaseline = 'middle'
  for (let m = Math.ceil(lo); m <= Math.floor(hi); m++) {
    const y0 = yOf(m + 0.5)
    const y1 = yOf(m - 0.5)
    const black = isBlack(m)
    const on = lit !== null && Math.round(lit) === m
    g.fillStyle = on ? `rgb(${GOLD} / 0.9)` : black ? `rgb(${INK} / 0.05)` : `rgb(${INK} / 0.13)`
    g.fillRect(0, y0 + 0.5, black ? 9 : 15, Math.max(1, y1 - y0 - 1))
    if (m % 12 === 0) {
      const y = yOf(m)
      g.fillStyle = `rgb(${INK} / 0.05)`
      g.fillRect(22, Math.round(y), W - 22, 1)
      g.fillStyle = `rgb(${INK} / ${on ? 0.8 : 0.32})`
      g.fillText(noteName(m), 21, y - 7)
    }
  }
}

// le chemin de la voix : un trait doré derrière la lueur, qui s'efface vers la gauche
export function path(g: CanvasRenderingContext2D, pts: { x: number; y: number }[], lightX: number) {
  g.lineWidth = 2
  g.lineCap = 'round'
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    g.strokeStyle = `rgb(${GOLD} / ${0.55 * Math.max(0, Math.min(1, b.x / lightX)) ** 1.5})`
    g.beginPath()
    g.moveTo(a.x, a.y)
    g.lineTo(b.x, b.y)
    g.stroke()
  }
}

// la lueur : un halo, plus large quand on chante fort ; au repos, à peine allumée
export function light(g: CanvasRenderingContext2D, x: number, y: number, glow: number, t: number) {
  const r = 14 + glow * 34 + Math.sin(t * 3) * 1.5
  const halo = g.createRadialGradient(x, y, 0, x, y, r * 2.2)
  halo.addColorStop(0, `rgb(${GOLD} / ${0.35 + glow * 0.45})`)
  halo.addColorStop(0.35, `rgb(${GOLD} / ${0.08 + glow * 0.18})`)
  halo.addColorStop(1, `rgb(${GOLD} / 0)`)
  g.fillStyle = halo
  g.beginPath()
  g.arc(x, y, r * 2.2, 0, Math.PI * 2)
  g.fill()
  g.font = FONT(18)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillStyle = `rgb(255 244 220 / ${0.6 + glow * 0.4})`
  g.fillText('✦', x, y)
}

// une note à attraper : un ♪ pâle, qui se balance un peu ; attrapée (caught : depuis combien de secondes), elle
// devient dorée, grossit, monte et s'efface, en laissant deux ou trois étincelles
export function note(g: CanvasRenderingContext2D, x: number, y: number, t: number, caught: number | null) {
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  if (caught === null) {
    g.font = FONT(22)
    g.fillStyle = `rgb(${INK} / 0.7)`
    g.fillText('♪', x, y + Math.sin(t * 2 + x * 0.05) * 2)
    return
  }
  const k = Math.min(1, caught / 0.9)
  g.font = FONT(22 + k * 14)
  g.fillStyle = `rgb(${GOLD} / ${1 - k})`
  g.fillText('♪', x, y - k * 26)
  g.font = FONT(12)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.6
    g.fillText('*', x + Math.cos(a) * k * 30, y - k * 10 + Math.sin(a) * k * 30)
  }
}
