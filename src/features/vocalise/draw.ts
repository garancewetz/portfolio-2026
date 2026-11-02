// Le dessin de Vocalise, dans le canvas : le ciel étoilé, les collines du fond (elles défilent plus lentement), les
// bouts de colline où court la lueur, séparés par des précipices (au-dessus de chacun, en lettres pâles, le son
// qu'il demande : « a » pour un saut, « aaaaaaa » pour un long ; certains ont des pics qui pendent), le chemin de la
// lueur, et la lueur. Tout est en caractères ou presque, à l'encre pâle ; les couleurs suivent la nuit (dawn.ts).

import { ground, roofOf, type Ledge } from './world'

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
// le ciel : des étoiles en caractères, qui défilent à peine, et scintillent
const STARS = ['.', '·', '·', '+', '*']
// (fade : de 1, la nuit, à 0, quand le jour se lève)
export function sky(g: CanvasRenderingContext2D, W: number, H: number, travelled: number, t: number, fade: number) {
  if (fade <= 0) return
  g.font = FONT(11)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const n = Math.round((W * H) / 9000)
  for (let i = 0; i < n; i++) {
    const x = (((hash(i) * W * 1.5 - travelled * 0.03) % (W * 1.5)) + W * 1.5) % (W * 1.5)
    if (x > W) continue
    const y = hash(i + 0.5) ** 1.4 * H * 0.75
    const a = fade * (0.18 + 0.32 * hash(i + 0.25) * (0.6 + 0.4 * Math.sin(t * (0.6 + hash(i + 0.75)) + i)))
    g.fillStyle = `rgb(${INK} / ${a})`
    g.fillText(STARS[Math.floor(hash(i + 0.9) * STARS.length)], x, y)
  }
}

// les collines du fond, pleines, loin derrière
export function far(g: CanvasRenderingContext2D, W: number, H: number, travelled: number, colour: string) {
  g.beginPath()
  g.moveTo(0, H)
  for (let x = 0; x <= W + 8; x += 8) g.lineTo(x, backHill(x, H, travelled))
  g.lineTo(W, H)
  g.fillStyle = colour
  g.fill()
}

// les bouts de colline : pleins jusqu'en bas, une herbe en caractères sur la crête, çà et là un petit arbre, et
// les bords des précipices un peu effrités ; au-dessus de chaque précipice, le son qu'il demande (doré, une fois
// franchi), et parfois des pics, accrochés à un bout de roche (alors le son s'écrit dessous, et il est bref)
const GRASS = [',', "'", '.', '`', ',', '.']
export function ledges(
  g: CanvasRenderingContext2D,
  W: number,
  H: number,
  s: number,
  list: Ledge[],
  travelled: number,
  colour: string,
) {
  g.textAlign = 'center'
  for (let i = 0; i < list.length; i++) {
    const l = list[i]
    const x0 = l.x0 - travelled
    const x1 = l.x1 - travelled
    const top = ground(l, H)
    if (x1 > -20 && x0 < W + 20) {
      g.fillStyle = colour
      g.fillRect(x0, top, x1 - x0, H - top)
      g.textBaseline = 'bottom'
      g.font = FONT(12)
      const STEP = 9
      for (let k = Math.ceil(Math.max(l.x0, travelled - STEP) / STEP); k * STEP <= Math.min(l.x1, travelled + W + STEP); k++) {
        const x = k * STEP - travelled
        const r = hash(k)
        if (r > 0.975 && x - x0 > 20 && x1 - x > 20) {
          g.fillStyle = `rgb(${INK} / 0.32)`
          g.font = FONT(20)
          g.fillText('↟', x, top + 3)
          g.font = FONT(12)
        } else {
          g.fillStyle = `rgb(${INK} / ${0.1 + r * 0.16})`
          g.fillText(GRASS[Math.floor(r * GRASS.length)], x, top + 3)
        }
      }
      // (les bords : quelques cailloux qui pendent)
      g.textBaseline = 'middle'
      g.fillStyle = `rgb(${INK} / 0.14)`
      for (let j = 0; j < 5; j++) {
        const y = top + 14 + j * 15
        g.fillText(j % 2 ? ':' : '.', x0 + 3 + hash(i + j) * 3, y)
        g.fillText(j % 2 ? '.' : ':', x1 - 3 - hash(i - j) * 3, y)
      }
    }
    // le son du précipice qui suit, centré au-dessus du vide
    const next = list[i + 1]
    if (!next) continue
    const mid = (x1 + next.x0 - travelled) / 2
    if (mid < -200 || mid > W + 200) continue
    const word = 'a'.repeat(Math.max(1, Math.round(l.hold * 4)))
    let y = Math.min(top, ground(next, H)) - H * 0.2
    if (l.roof) {
      const roof = roofOf(l, next, H, s)
      const a = x1 - 30 * s
      const b = next.x0 - travelled + 30 * s
      g.fillStyle = colour
      g.fillRect(a, roof - 40 * s, b - a, 40 * s)
      g.font = FONT(14)
      g.textBaseline = 'top'
      g.fillStyle = `rgb(${INK} / 0.55)`
      for (let x = a + 6; x < b - 3; x += 11) g.fillText('V', x, roof - 3)
      y = roof + 45 * s
    }
    g.font = `italic ${Math.round(Math.min(30, 18 + l.hold * 3))}px 'Instrument Serif', serif`
    g.textBaseline = 'middle'
    g.fillStyle = l.crossed ? `rgb(${GOLD} / 0.75)` : `rgb(${INK} / 0.42)`
    g.fillText(word, mid, y)
  }
}

// le chemin de la lueur : un trait doré derrière elle, qui s'efface vers la gauche
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
