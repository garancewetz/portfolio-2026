import { choices, gear } from '@/features/carnet/gear'

// The trail: wherever he goes (walking, jumping, climbing, hanging, dragged), his back foot leaves a line on a
// canvas under him. A line is not a floor: you go through it, you do not land on it; but you can grab it, and
// climb it in every direction (see body.ts, 'line'). The trail stays until you leave the page, the window
// changes size, or he goes through the door. The cog wheel chooses: the magic pencil (multicolour lead: several
// colours side by side, changing with the line's direction), a black line, dots, or nothing.

const KINDS = ['multicolore', 'trait', 'points', 'rien'] as const
type Kind = (typeof KINDS)[number]
const GAP = 9 // px between two points
const INK = '#1a1917'
// the magic pencil (multicolour lead): the lead mixes several colours in wedges; the line, fairly wide, shows
// several side by side, like stripes along the line (one edge blue, the other yellow or red, green, purple
// where they meet). Depending on the line's direction, the lead rubs the paper with another face: the edge
// colours change. The wedges of the lead, in order, all the way round:
const LEAD = [
  [47, 95, 176], // blue
  [233, 197, 45], // yellow
  [217, 83, 43], // orange red
  [72, 48, 120], // dark purple
]
// the lead's colour at this angle (in turns: 0 to 1), between two wedges, blended
function tint(turn: number) {
  const f = ((((turn % 1) + 1) % 1) * LEAD.length) % LEAD.length
  const a = LEAD[Math.floor(f)]
  const b = LEAD[(Math.floor(f) + 1) % LEAD.length]
  const k = f - Math.floor(f)
  return a.map((v, i) => Math.round(v + (b[i] - v) * k))
}
const BANDS = [-2.4, -1.2, 0, 1.2, 2.4] // the stripes, across the line (px)
const FRESH = 400 // ms: the bit he has just drawn, he does not grab it (it is still under his foot)
const JUMP = 80 // px from one frame to the next: farther, it is a leap (the trail breaks off)

type Seg = { x1: number; y1: number; x2: number; y2: number; t: number }
// the point of a line segment closest to (px, py), and the line's direction (from its start to its end)
function closest(s: Seg, px: number, py: number) {
  const dx = s.x2 - s.x1
  const dy = s.y2 - s.y1
  const len = Math.hypot(dx, dy) || 1
  const k = Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / (len * len)))
  const x = s.x1 + dx * k
  const y = s.y1 + dy * k
  return { x, y, ux: dx / len, uy: dy / len, d: Math.hypot(px - x, py - y) }
}

export function createTrail(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  let kind: Kind = 'multicolore'
  let last: { x: number; y: number } | null = null
  let since = 0 // (the path since the last point laid)
  let segs: Seg[] = [] // (what he has drawn)

  // erase everything
  const clear = () => {
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    last = null
    segs = []
  }
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2)
    canvas.width = Math.round(canvas.clientWidth * dpr)
    canvas.height = Math.round(canvas.clientHeight * dpr)
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
    clear()
  }
  resize()
  addEventListener('resize', resize)

  return {
    // his back foot is here: the trail follows it
    to(x: number, y: number) {
      if (!ctx || kind === 'rien') return
      if (!last) {
        last = { x, y }
        return
      }
      const d = Math.hypot(x - last.x, y - last.y)
      if (d < 0.5) return
      // (a leap: grabbed, carried off at once by the mouse; the trail does not join up, it picks up from there)
      if (d > JUMP) {
        last = { x, y }
        return
      }
      segs.push({ x1: last.x, y1: last.y, x2: x, y2: y, t: performance.now() })
      if (kind === 'multicolore') {
        // stripes side by side, across the line: each one the face of the lead rubbing at that spot (they turn with
        // the line's direction); the pencil's grain: each pass slightly offset, pressed more or less hard
        const dx = x - last.x
        const dy = y - last.y
        const n = { x: -dy / d, y: dx / d } // (across the line)
        const turn = Math.atan2(dy, dx) / (2 * Math.PI)
        // (square ends: rounded, overlapping ends would make darker dots)
        ctx.lineCap = 'butt'
        const from = last
        BANDS.forEach((off, i) => {
          const [r, g, b] = tint(turn + 0.25 + (i / (BANDS.length - 1)) * 0.5)
          const j = () => (Math.random() - 0.5) * 0.5
          ctx.strokeStyle = `rgb(${r} ${g} ${b} / ${0.5 + Math.random() * 0.25})`
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(from.x + n.x * off + j(), from.y + n.y * off + j())
          ctx.lineTo(x + n.x * off + j(), y + n.y * off + j())
          ctx.stroke()
        })
      } else if (kind === 'trait') {
        ctx.strokeStyle = INK
        ctx.lineWidth = 1.4
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(last.x, last.y)
        ctx.lineTo(x, y)
        ctx.stroke()
      } else {
        // regular dots, along the path
        ctx.fillStyle = INK
        since += d
        while (since >= GAP) {
          since -= GAP
          const k = 1 - since / d
          ctx.beginPath()
          ctx.arc(last.x + (x - last.x) * k, last.y + (y - last.y) * k, 1.6, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      last = { x, y }
    },
    // the line closest to (x, y), within reach px: the point to grab, and the line's direction
    // (not the bit he has just drawn, still under his foot)
    // (keep: only the points that fit, for instance above his head)
    near(x: number, y: number, reach: number, keep?: (p: { x: number; y: number; ux: number; uy: number }) => boolean) {
      const now = performance.now()
      let best: ReturnType<typeof closest> | null = null
      for (const s of segs) {
        if (now - s.t < FRESH) continue
        const c = closest(s, x, y)
        if (c.d <= reach && (!best || c.d < best.d) && (!keep || keep(c))) best = c
      }
      return best
    },
    clear,
    // he disappears from here (another window), or reappears elsewhere: the trail does not join them
    lift() {
      last = null
    },
    // the cog wheel, in the notebook line
    settings(slot: HTMLElement) {
      gear(slot, 'Réglages de la traînée', [
        choices('traînée', KINDS, kind, (k) => {
          kind = k
          last = null
        }),
      ])
    },
  }
}
