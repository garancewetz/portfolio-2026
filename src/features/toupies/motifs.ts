import * as THREE from 'three'
import { birds } from './oiseau'

// The tops and the image printed on their tinplate (across, the top's circumference; down, its profile, from the
// top of the image to the bottom; edge: where the rim is). Each has its effect, when spinning:
// - quarters, stripes, two-tone: bands that blend into a single colour (the eye averages the light: see top.ts)
//   — a soft hue; grey; and, for blue and yellow, not green as in paint but a light grey (the eye adds lights, it
//   does not mix pigments);
// - dots: coloured dots on a cream background, which become rings;
// - benham: only black and white, but when spinning the eye sees pale colours that do not exist (Benham's
//   illusion, 1894); without simulated blur: the eye does it;
// - bird: a ring of eight birds in profile, at eight moments of a wingbeat (see oiseau.ts);
// - lamps: dark, with small lamps lighting up as it spins; spinning fast, each dot stretches into a line, then
//   into a continuous ring: three neon threads (see top.ts).
// plastic: the colour of its plastic parts; blur: whether the eye's blur is simulated; max: its highest speed
// (in radians per second). All have the same shape: their colour and pattern set them apart.

type Kind = 'bands' | 'pois' | 'benham' | 'oiseau' | 'lampes'
type Def = {
  kind: Kind
  colors: string[]
  bands: number
  rim: string
  dots: string
  plastic: string
  blur: boolean
  max: number
}
const def = (d: Partial<Def> & Pick<Def, 'colors'>): Def => ({
  kind: 'bands',
  bands: 12,
  rim: '#1f2a5c',
  dots: '#f7efdc',
  plastic: '#8fcaf0',
  blur: true,
  max: 130,
  ...d,
})

export const VARIANTS = {
  quartiers: def({ colors: ['#ff6f91', '#ffd23f', '#3ec5c8', '#8f6bd8'] }),
  rayures: def({ colors: ['#151515', '#f7f5f0'], bands: 24, rim: '#e5483b', dots: '#f7f5f0', plastic: '#ef5a4c' }),
  pois: def({
    kind: 'pois',
    colors: ['#f7efdc', '#e5483b', '#2f6fd8', '#2fa866', '#f2b62f'],
    rim: '#2f6fd8',
    dots: '#f7efdc',
    plastic: '#f2b62f',
  }),
  bicolore: def({ colors: ['#2f63d8', '#ffd23f'], bands: 16, rim: '#ffd23f', dots: '#2f63d8', plastic: '#2f63d8' }),
  benham: def({
    kind: 'benham',
    colors: ['#111111', '#f7f5f0'],
    rim: '#111111',
    dots: '#f7f5f0',
    plastic: '#2b2b2b',
    blur: false,
    max: 55,
  }),
  oiseau: def({ kind: 'oiseau', colors: ['#f3ead8'], rim: '#1f2a5c', dots: '#f3ead8', plastic: '#3ec5c8' }),
  lampes: def({ kind: 'lampes', colors: ['#141a3a'], rim: '#0b0f26', dots: '#ffe7a3', plastic: '#c9b8ff' }),
}
export type Variant = keyof typeof VARIANTS
// the lamp colours of the light-up top (one per row: a neon ring each)
export const LAMPS = ['#ff4f9a', '#4fe3ff', '#ffd23f']

const W = 2048
const H = 1024
function canvas() {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  return { c, g: c.getContext('2d')! }
}
function texture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  t.wrapS = THREE.RepeatWrapping
  return t
}

// the tinplate image; and, for the light-up top, the image of its lamps (what lights up)
export function motifs(edge: number, variant: Variant) {
  const d = VARIANTS[variant]
  const { c, g } = canvas()
  const y = (v: number) => v * H
  const top0 = 0.08
  const top1 = edge - 0.05
  let glow: THREE.Texture | null = null
  if (d.kind === 'bands') {
    for (let k = 0; k < d.bands; k++) {
      g.fillStyle = d.colors[k % d.colors.length]
      g.fillRect((k * W) / d.bands, 0, W / d.bands + 1, H)
    }
  } else if (d.kind === 'benham') {
    // one half black; the other white, with four groups of three arcs, each farther from the centre
    g.fillStyle = d.colors[1]
    g.fillRect(0, 0, W, H)
    g.fillStyle = d.colors[0]
    g.fillRect(0, 0, W / 2, H)
    for (let k = 0; k < 4; k++)
      for (let a = 0; a < 3; a++) {
        const v = top0 + ((top1 - top0) * (k * 3 + a + 0.5)) / 12
        g.fillRect(W / 2 + (k * W) / 8, y(v) - 5, W / 8, 10)
      }
  } else if (d.kind === 'pois') {
    // coloured dots, round, at different heights; when spinning, each traces its ring
    g.fillStyle = d.colors[0]
    g.fillRect(0, 0, W, H)
    const rows = [0.16, 0.27, 0.38, edge + 0.1, edge + 0.22, edge + 0.34]
    rows.forEach((v, row) => {
      const n = 9 + (row % 3) * 3
      for (let k = 0; k < n; k++) {
        g.fillStyle = d.colors[1 + ((row + k) % 4)]
        g.beginPath()
        g.arc(((k + (row % 2) * 0.5) * W) / n, y(v), 26, 0, Math.PI * 2)
        g.fill()
      }
    })
  } else {
    g.fillStyle = d.colors[0]
    g.fillRect(0, 0, W, H)
    // (the ring of birds, on the upper cup, near the rim: their backs towards the centre)
    if (d.kind === 'oiseau') birds(g, W, y(top1 - 0.12), 200, d.rim)
  }
  // the rim: a polka-dot band
  g.fillStyle = d.rim
  g.fillRect(0, y(edge - 0.03), W, y(0.06))
  for (let k = 0; k < 48; k++) {
    g.fillStyle = d.dots
    g.beginPath()
    g.arc((k + 0.5) * (W / 48), y(edge), 9, 0, Math.PI * 2)
    g.fill()
  }
  if (d.kind === 'lampes') {
    // the lamps: three rows of small round lamps, one colour per row; their image apart (what shines)
    const lamps = canvas()
    lamps.g.fillStyle = '#000'
    lamps.g.fillRect(0, 0, W, H)
    const rows = [top0 + (top1 - top0) * 0.45, top0 + (top1 - top0) * 0.85, edge + 0.12]
    rows.forEach((v, row) => {
      for (let k = 0; k < 18; k++) {
        const x = (k + 0.5) * (W / 18)
        for (const ctx of [g, lamps.g]) {
          ctx.fillStyle = LAMPS[row]
          ctx.beginPath()
          ctx.arc(x, y(v), 22, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    })
    glow = texture(lamps.c)
  }
  return { map: texture(c), glow }
}
