import { pose, type Bouncer } from './bounce'

// Les cordes à linge : une ficelle par créature, tendue entre deux attaches, à des hauteurs et des longueurs
// différentes sur la page (pas en grille). La ficelle se creuse sous la créature ; elle s'y tient debout (ou en
// l'air, au-dessus) ; endormie, un petit z près de sa tête ; réveillée, son nom sous la ficelle.

// où sont tendues les ficelles (en fractions de la page : de, à, hauteur) ; sur un téléphone, l'une sous l'autre
const WIDE = [
  [0.06, 0.24, 0.36],
  [0.3, 0.44, 0.3],
  [0.52, 0.72, 0.42],
  [0.78, 0.94, 0.34],
  [0.12, 0.3, 0.68],
  [0.4, 0.58, 0.74],
  [0.66, 0.86, 0.66],
]
const NARROW = WIDE.map((_, i) => (i % 2 ? [0.36, 0.92, 0.2 + i * 0.105] : [0.08, 0.64, 0.2 + i * 0.105]))
const narrow = matchMedia('(max-width: 700px)')
const SVG = 'http://www.w3.org/2000/svg'

export interface Line {
  b: Bouncer
  ax: number
  bx: number
  y: number
  x: number
  art: HTMLPreElement
  z: HTMLSpanElement
  name: HTMLSpanElement
  hit: HTMLDivElement
  path: SVGPathElement
}

// les ficelles, dans la page (room) ; onStir : quand la souris arrive sur une créature, ou s'en va
export function lines(room: HTMLElement, bouncers: Bouncer[], onStir: () => void) {
  const svg = document.createElementNS(SVG, 'svg')
  svg.classList.add('cr-lines')
  room.append(svg)
  const all: Line[] = bouncers.map((b) => {
    const art = Object.assign(document.createElement('pre'), { className: 'cr-art' })
    art.setAttribute('aria-label', b.c.name)
    const z = Object.assign(document.createElement('span'), { className: 'cr-z', textContent: 'z' })
    const name = Object.assign(document.createElement('span'), { className: 'cr-name', textContent: b.c.name })
    const hit = Object.assign(document.createElement('div'), { className: 'cr-hit' })
    const path = svg.appendChild(document.createElementNS(SVG, 'path'))
    room.append(art, z, name, hit)
    hit.addEventListener('pointerenter', () => {
      b.hover = true
      onStir()
    })
    hit.addEventListener('pointerleave', () => {
      b.hover = false
      onStir()
    })
    // (au doigt, pas de survol : un toucher la réveille un moment)
    hit.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return
      b.hover = true
      onStir()
      setTimeout(() => {
        b.hover = false
        onStir()
      }, 2600)
    })
    return { b, ax: 0, bx: 0, y: 0, x: 0, art, z, name, hit, path }
  })

  // (la place de chaque ficelle, à la taille de la page)
  function place() {
    const w = room.clientWidth
    const h = room.clientHeight
    const spots = narrow.matches ? NARROW : WIDE
    all.forEach((l, i) => {
      const [a, b, y] = spots[i % spots.length]
      Object.assign(l, { ax: a * w, bx: b * w, y: y * h, x: ((a + b) / 2) * w })
    })
  }

  // le dessin : la ficelle (jamais tout à fait tendue), la créature les pieds dessus, son z, son nom ; awake :
  // où sont les pieds de chacune, réveillée (pour la trace de ses sauts, voir trace.ts)
  function draw(awake?: (i: number, x: number, y: number) => void) {
    all.forEach((l, i) => {
      const { b } = l
      const low = l.y + Math.max(0, b.s) + 4
      l.path.setAttribute('d', `M${l.ax},${l.y} Q${(l.ax + l.x) / 2},${low} ${l.x},${low} Q${(l.x + l.bx) / 2},${low} ${l.bx},${l.y}`)
      const p = pose(b)
      const text = p.join('\n')
      if (l.art.textContent !== text) l.art.textContent = text
      const foot = low - Math.max(0, b.z)
      if (b.awake) awake?.(i, l.x, foot)
      l.art.style.transform = `translate(${l.x}px, ${foot + 2}px) translate(-50%, -100%)`
      const top = foot - l.art.offsetHeight
      l.z.style.transform = `translate(${l.x + 28}px, ${top - 8}px)`
      l.z.classList.toggle('is-off', b.awake)
      l.name.style.transform = `translate(${l.x}px, ${l.y + 18}px) translateX(-50%)`
      l.name.classList.toggle('is-on', b.awake)
      // (la zone qui la réveille : elle, et un peu de place autour, pour ses sauts)
      l.hit.style.cssText = `left:${l.x - 48}px;top:${l.y - 120}px;width:96px;height:150px`
    })
  }

  place()
  addEventListener('resize', () => {
    place()
    draw()
  })
  return { draw }
}
