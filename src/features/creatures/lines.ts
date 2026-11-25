import { pose, type Bouncer } from './bounce'

// The clotheslines: one string per creature, stretched between two hooks, at different heights and lengths
// across the page (not in a grid). The string dips under the creature; it stands on it (or in the air, above);
// asleep, a little z near its head; awake, its name under the string.

// where the strings are stretched (as fractions of the page: from, to, height); on a phone, one below the other
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

interface Line {
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

// the strings, in the page (room); onStir: when the mouse reaches a creature, or leaves it
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
    // (with a finger, no hover: a touch wakes it up for a while)
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

  // (each string's place, at the page's size)
  function place() {
    const w = room.clientWidth
    const h = room.clientHeight
    const spots = narrow.matches ? NARROW : WIDE
    all.forEach((l, i) => {
      const [a, b, y] = spots[i % spots.length]
      Object.assign(l, { ax: a * w, bx: b * w, y: y * h, x: ((a + b) / 2) * w })
    })
  }

  // the drawing: the string (never quite taut), the creature with its feet on it, its z, its name; awake:
  // where each one's feet are, when awake (for the trace of its jumps, see trace.ts)
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
      // (the area that wakes it up: itself, and a little room around it, for its jumps)
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
