import * as THREE from 'three'
import { birds } from './oiseau'

// Les toupies et l'image imprimée sur leur tôle (en largeur le tour de la toupie, en hauteur son profil, du haut en
// haut de l'image au bas ; edge : où est le bord). Chacune a son effet, en tournant :
// - quartiers, rayures, bicolore : des bandes qui se fondent en une seule couleur (l'œil fait la moyenne de la
//   lumière : voir top.ts) — une teinte douce ; du gris ; et, pour le bleu et le jaune, pas du vert comme en
//   peinture mais un gris clair (l'œil additionne les lumières, il ne mélange pas les pigments) ;
// - pois : des pois de couleur sur fond crème, qui deviennent des anneaux ;
// - benham : du noir et du blanc seulement, mais en tournant l'œil y voit de pâles couleurs qui n'existent pas
//   (l'illusion de Benham, 1894) ; sans flou simulé : c'est l'œil qui la fait ;
// - spirale : rouge et crème, comme un sucre d'orge ; elle semble grandir en tournant, et rentrer en elle-même quand
//   elle s'arrête (sans flou simulé) ;
// - oiseau : une ronde de huit oiseaux de profil, à huit moments d'un coup d'aile (voir oiseau.ts) ;
// - lampes : sombre, avec de petites lampes qui s'allument en tournant ; en tournant vite, chaque point s'étire en
//   trait, puis en anneau continu : trois fils de néon (voir top.ts) ;
// - miroir : polie, sans décor, elle reflète la page et les autres toupies ; ronde tout autour de son axe, elle a
//   l'air immobile même quand elle tourne à toute vitesse : seul son vacillement la trahit (voir top.ts).
// plastic : la couleur de ses pièces en plastique ; blur : si l'on simule le flou de l'œil ; max : sa vitesse la plus
// haute (en radians par seconde). Toutes ont la même forme : c'est leur couleur et leur décor qui les distinguent.

type Kind = 'bands' | 'pois' | 'benham' | 'spirale' | 'oiseau' | 'lampes' | 'miroir'
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
  spirale: def({
    kind: 'spirale',
    colors: ['#d8342b', '#f7efdc'],
    rim: '#f7efdc',
    dots: '#d8342b',
    plastic: '#3fae6a',
    blur: false,
    max: 40,
  }),
  oiseau: def({
    kind: 'oiseau',
    colors: ['#f3ead8'],
    rim: '#1f2a5c',
    dots: '#f3ead8',
    plastic: '#3ec5c8',
  }),
  miroir: def({ kind: 'miroir', colors: ['#ffffff'], plastic: '#f4f1ea', blur: false }),
  lampes: def({ kind: 'lampes', colors: ['#141a3a'], rim: '#0b0f26', dots: '#ffe7a3', plastic: '#c9b8ff' }),
}
export type Variant = keyof typeof VARIANTS
// les couleurs des lampes de la toupie lumineuse (une par rangée : un anneau de néon chacune)
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

// l'image de la tôle ; et, pour la toupie lumineuse, l'image de ses lampes (ce qui s'allume)
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
    // une moitié noire ; l'autre blanche, avec quatre groupes de trois arcs, chacun plus loin du centre
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
    // des pois de couleur, ronds, à des hauteurs différentes ; en tournant, chacun trace son anneau
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
  } else if (d.kind === 'spirale') {
    // une spirale : des bandes qui tournent en descendant le long du profil
    g.fillStyle = d.colors[1]
    g.fillRect(0, 0, W, H)
    g.fillStyle = d.colors[0]
    const N = 6
    const slant = W * 1.5
    for (let k = -N * 3; k < N * 3; k++) {
      const x = (k * W) / N
      g.beginPath()
      g.moveTo(x, 0)
      g.lineTo(x + W / N / 2, 0)
      g.lineTo(x + W / N / 2 + slant, H)
      g.lineTo(x + slant, H)
      g.fill()
    }
  } else {
    g.fillStyle = d.colors[0]
    g.fillRect(0, 0, W, H)
    // (la ronde d'oiseaux, sur la coupelle du haut, près du bord : leur dos vers le centre)
    if (d.kind === 'oiseau') birds(g, W, y(top1 - 0.12), 200, d.rim)
  }
  // le bord : un bandeau à pois
  g.fillStyle = d.rim
  g.fillRect(0, y(edge - 0.03), W, y(0.06))
  for (let k = 0; k < 48; k++) {
    g.fillStyle = d.dots
    g.beginPath()
    g.arc((k + 0.5) * (W / 48), y(edge), 9, 0, Math.PI * 2)
    g.fill()
  }
  if (d.kind === 'lampes') {
    // les lampes : trois rangées de petites lampes rondes, une couleur par rangée ; leur image à part (ce qui brille)
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
