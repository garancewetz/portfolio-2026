// The fireworks engine: real sparks (particles), drawn as thin strokes on a transparent canvas laid over the paper
// background. Each frame erases a little of the previous one: the sparks leave trails. A rocket rises
// zigzagging, sowing gold, then bursts; the sparks fly out in a star, slowed by the air and pulled down, with a
// slight sway (as in water), then twinkle and die out. Several kinds of bursts: peony, chrysanthemum (which
// crackles), willow (golden, falling back slowly), palm (big arms), ring.
// Loaded only when the mode is turned on (see Fireworks.tsx).

import { GOLD, SHELLS, rand, shellOf, type Add, type Shell, type Spark } from './shells'

// the colours of the project screenshots (the same, in the same order, as the liquid: see fluid.ts):
// the grid's purple, pink, blue, green, orange, gold
export const COLORS = ['#7d5cd6', '#d65c96', '#3d7ae0', '#2ea36b', '#f08a3d', '#e8ba30']
// the core of the strokes: the same colour, barely lightened (so it stays vivid, not white)
const CORES = COLORS.map((hex) => {
  const n = parseInt(hex.slice(1), 16)
  const mix = (v: number) => Math.round(v + (255 - v) * 0.12)
  return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`
})
const STEPS = 4 // opacity shades (strokes are drawn by colour and by shade, in one go)
const MAX = 14000 // sparks at once, at most (on a large screen; fewer on a small one, see resize)
const TRAIL = 6 // how fast the trails fade (larger: shorter trails)
const GRAVITY = 140 // px/s²

export interface Show {
  /** a burst, centred on (x, y) (CSS px, in the window); size: its size (1 = normal) */
  burst(x: number, y: number, size?: number): void
  /** a rocket that leaves from the bottom of the screen and bursts at (x, y) */
  launch(x: number, y: number, size?: number, trail?: number): void
  /** one frame: everything moves forward by dt seconds; returns the number of sparks still in flight */
  step(dt: number): number
  resize(): void
  clear(): void
}

// onBurst: notified on each explosion (for the liquid colour halo, underneath), with its two colours;
// palette (optional): the allowed colours (their places in COLORS), otherwise all of them
export function createShow(
  canvas: HTMLCanvasElement,
  onBurst?: (x: number, y: number, size: number, colors: [number, number]) => void,
  palette?: () => readonly number[],
): Show | null {
  // (in floating-point colours, where the browser allows it: in 8 bits, fading the trails rounds off and leaves a
  // ghost of every stroke forever, visible against the night)
  const ctx = canvas.getContext('2d', { colorType: 'float16' } as CanvasRenderingContext2DSettings)
  if (!ctx) return null
  let w = 0
  let h = 0
  // at the screen's scale: on a phone, smaller bursts (they fit on the screen) and fewer sparks at once
  let scale = 1
  let max = MAX
  let time = 0
  const sparks: Spark[] = []
  const pick = () => {
    const p = palette?.()
    return p?.length ? p[Math.floor(Math.random() * p.length)] : Math.floor(Math.random() * COLORS.length)
  }
  // the gold of rockets, crackles and willows: gold, unless the palette has none (one of its colours)
  const gold = () => {
    const p = palette?.()
    return !p?.length || p.includes(GOLD) ? GOLD : pick()
  }

  // (depth: a near burst, larger, also has thicker strokes)
  let thick = 1
  const add: Add = (s) => {
    if (sparks.length < max) sparks.push({ ...s, width: s.width * thick, px: s.x, py: s.y })
  }

  const burst = (
    x: number,
    y: number,
    size = 1,
    shell: Shell = SHELLS[Math.floor(Math.random() * SHELLS.length)],
    colors: [number, number] = [pick(), pick()],
  ) => {
    const [a, b] = colors
    // (the halo follows the burst's real size, at the screen's scale)
    onBurst?.(x, y, size * scale, colors)
    thick = Math.min(1.6, Math.max(0.6, Math.sqrt(size)))
    try {
      shellOf(add, x, y, rand(260, 380) * size * scale, shell, a, b, gold())
    } finally {
      thick = 1
    }
  }

  // trail: the colour of the rocket and of what it sows (gold, usually)
  const launch = (x: number, y: number, size = 1, given = GOLD) => {
    // (gold usually: the palette's)
    const trail = given === GOLD ? gold() : given
    // the rocket rises from the bottom, roughly straight below the burst point
    const x0 = x + rand(-60, 60)
    const y0 = h + 10
    const dur = rand(0.75, 1.05)
    // (starting speed which, slowed by gravity, arrives exactly at (x, y) after dur)
    const vy = (y - y0 - 0.5 * GRAVITY * 0.35 * dur * dur) / dur
    add({
      x: x0,
      y: y0,
      vx: (x - x0) / dur,
      vy,
      drag: 0,
      fall: 0.35,
      life: dur,
      max: dur,
      color: trail,
      width: given === GOLD ? 2.6 : 3.4,
      crackle: false,
      rocket: { shell: SHELLS[Math.floor(Math.random() * SHELLS.length)], size, colors: [pick(), pick()], trail },
    })
  }

  const step = (dt: number) => {
    time += dt
    // the trails: what is already drawn fades a little
    ctx.globalCompositeOperation = 'destination-out'
    ctx.globalAlpha = 1 - Math.exp(-dt * TRAIL)
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'

    const born: (() => void)[] = []
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]
      s.px = s.x
      s.py = s.y
      const k = Math.exp(-s.drag * dt)
      s.vx *= k
      s.vy = s.vy * k + GRAVITY * s.fall * dt
      // the slight sway, as in water
      s.vx += Math.sin(s.y * 0.02 + time * 3) * 18 * dt
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.life -= dt
      if (s.rocket) {
        // the rocket sows gold (or its colour) behind it
        if (Math.random() < 0.8) {
          add({
            x: s.x,
            y: s.y,
            vx: rand(-20, 20),
            vy: rand(10, 50),
            drag: 2,
            fall: 0.6,
            life: rand(0.3, 0.6),
            max: 0.6,
            color: s.rocket.trail,
            width: 1.4,
            crackle: false,
          })
        }
        if (s.life <= 0) {
          const { shell, size, colors } = s.rocket
          const { x, y } = s
          born.push(() => burst(x, y, size, shell, colors))
        }
      } else if (s.crackle && s.life < s.max * 0.3 && Math.random() < 0.25) {
        // crackle: tiny white-gold flashes, at random
        add({
          x: s.x,
          y: s.y,
          vx: rand(-60, 60),
          vy: rand(-60, 60),
          drag: 5,
          fall: 0.3,
          life: 0.12,
          max: 0.12,
          color: gold(),
          width: 1.6,
          crackle: false,
        })
      }
      if (s.life <= 0) {
        sparks[i] = sparks[sparks.length - 1]
        sparks.pop()
      }
    }
    for (const b of born) b()

    // the strokes, by colour and by opacity shade (at the end of their life: they die out twinkling)
    const groups: Spark[][] = Array.from({ length: COLORS.length * STEPS }, () => [])
    for (const s of sparks) {
      let a = s.rocket ? 1 : Math.min(1, s.life / (s.max * 0.5))
      if (!s.rocket && s.life < s.max * 0.2) a *= Math.random() < 0.5 ? 1 : 0.25
      const step = Math.min(STEPS - 1, Math.floor(a * STEPS))
      groups[s.color * STEPS + step].push(s)
    }
    // light on the night: each stroke has its halo (wide and light, halos add up: where sparks cross, it shines
    // brighter) and its core (thin, in its colour, laid on top without adding up: the colours stay vivid, they do
    // not turn white)
    for (let g = 0; g < groups.length; g++) {
      const list = groups[g]
      if (!list.length) continue
      const c = Math.floor(g / STEPS)
      const alpha = ((g % STEPS) + 1) / STEPS
      ctx.beginPath()
      for (const s of list) {
        ctx.moveTo(s.px, s.py)
        ctx.lineTo(s.x, s.y)
      }
      // (similar thicknesses: keep the first one's)
      // (the halo with square ends: rounded, at the end of their life, they would make dots)
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineCap = 'butt'
      ctx.strokeStyle = COLORS[c]
      ctx.globalAlpha = alpha * 0.18
      ctx.lineWidth = list[0].width * 2.2
      ctx.stroke()
      ctx.globalCompositeOperation = 'source-over'
      ctx.lineCap = 'round'
      ctx.strokeStyle = CORES[c]
      ctx.globalAlpha = alpha
      ctx.lineWidth = list[0].width
      ctx.stroke()
    }
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    return sparks.length
  }

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2)
    w = innerWidth
    h = innerHeight
    scale = Math.min(1, Math.max(0.45, w / 1300))
    max = Math.round(MAX * Math.min(1, Math.max(0.35, (w * h) / (1400 * 860))))
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()

  return {
    burst: (x, y, size) => burst(x, y, size),
    launch,
    step,
    resize,
    clear() {
      sparks.length = 0
      ctx.clearRect(0, 0, w, h)
    },
  }
}
