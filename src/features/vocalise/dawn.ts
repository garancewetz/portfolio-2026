// La nuit qui avance : de précipice en précipice, le ciel passe du bleu de la nuit à l'heure bleue, puis aux roses
// de l'aube ; les étoiles s'effacent, les collines s'éclaircissent, et au bout, le soleil se lève derrière elles.
// p : où en est la nuit, de 0 (le départ) à 1 (l'aube).

// le ciel (en haut, au milieu, à l'horizon), les collines où l'on court, celles du fond
type Colours = { top: string; mid: string; low: string; ledge: string; far: string }
const STOPS: [number, Colours][] = [
  [0, { top: '#090b1d', mid: '#141838', low: '#1b1f44', ledge: '#1d2244', far: '#161a35' }],
  [0.5, { top: '#0c1130', mid: '#20265a', low: '#363b74', ledge: '#232850', far: '#1e2349' }],
  [0.8, { top: '#18224f', mid: '#4d4680', low: '#b77f8a', ledge: '#2b2a52', far: '#3a3363' }],
  [1, { top: '#3b5b98', mid: '#b48fae', low: '#f3bf8c', ledge: '#3a3157', far: '#66527a' }],
]

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const mix = (a: string, b: string, k: number) => {
  const [x, y] = [rgb(a), rgb(b)]
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(' ')})`
}

export function colours(p: number): Colours {
  let i = 0
  while (i < STOPS.length - 2 && p > STOPS[i + 1][0]) i++
  const [p0, a] = STOPS[i]
  const [p1, b] = STOPS[i + 1]
  const k = Math.max(0, Math.min(1, (p - p0) / (p1 - p0)))
  return {
    top: mix(a.top, b.top, k),
    mid: mix(a.mid, b.mid, k),
    low: mix(a.low, b.low, k),
    ledge: mix(a.ledge, b.ledge, k),
    far: mix(a.far, b.far, k),
  }
}

// le soleil : il pointe derrière les collines du fond dans les derniers précipices, et finit de se lever à l'aube
// (rise : de 0 à 1, encore un peu après l'arrivée)
export function sun(g: CanvasRenderingContext2D, W: number, H: number, rise: number) {
  if (rise <= 0) return
  const x = W * 0.72
  const y = H * (0.86 - 0.3 * Math.min(1, rise))
  const r = Math.min(W, H) * 0.09
  const halo = g.createRadialGradient(x, y, r * 0.6, x, y, r * 5)
  halo.addColorStop(0, `rgb(255 214 150 / ${0.45 * Math.min(1, rise * 2)})`)
  halo.addColorStop(1, 'rgb(255 214 150 / 0)')
  g.fillStyle = halo
  g.fillRect(0, 0, W, H)
  g.fillStyle = `rgb(255 226 170 / ${Math.min(1, rise * 2)})`
  g.beginPath()
  g.arc(x, y, r, 0, Math.PI * 2)
  g.fill()
}
