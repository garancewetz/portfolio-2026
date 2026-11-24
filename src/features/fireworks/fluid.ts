// The liquid fireworks engine: a fluid simulation in WebGL2 (« stable fluids »: the liquid's velocity is carried
// by itself, made divergence-free, with a little extra swirl), into which colour is poured. A burst = drops of
// colour thrown out in a star from a point; the liquid stretches them, curls them, then the colour dissolves into
// the paper background.
// Loaded only when the mode is turned on (see Fireworks.tsx).

import { createPrograms, createTargets, type Double, type Target } from './gl'
import type { ProgName } from './shaders'

const SIM = 128 // velocity resolution (the short side)
const DYE = 640 // colour resolution (the short side)
const DYE_FADE = 0.55 // the colour dissolves (per second; adjustable, see createFluid)
const VEL_FADE = 0.35 // the liquid calms down (per second)
const PRESSURE_FADE = 0.8
const PRESSURE_STEPS = 20
const CURL = 22 // swirl strength (adjustable, see createFluid)
// the kinds of bursts: peony (one crown, two colours), chrysanthemum (two crowns and crackles),
// double (a 2nd explosion just after), willow (golden, falling back down)
const SHELLS = ['peony', 'chrysanthemum', 'double', 'willow', 'chrysanthemum'] as const
const GOLD = [1, 0.78, 0.32]

// the colours of the project screenshots (the same, in the same order, as the sparks: see show.ts) (Signe's blue, Synapso's green, Trans-trame's pink…)
const COLORS: [number, number, number][] = [
  [0.49, 0.36, 0.84], // the grid's purple
  [0.84, 0.36, 0.59], // pink
  [0.24, 0.48, 0.88], // blue
  [0.18, 0.64, 0.42], // green
  [0.94, 0.54, 0.24], // orange
  [0.91, 0.73, 0.19], // gold
]

export interface Fluid {
  /** a burst, centred on (x, y) (CSS px, in the window) */
  burst(x: number, y: number, size?: number, colors?: [number, number]): void
  /** one frame: the liquid moves forward by dt seconds, then is displayed */
  step(dt: number): void
  resize(): void
  clear(): void
  destroy(): void
}

// ink: the amount of colour poured (1: full; less: a light halo, under the sparks); fade: how fast it dissolves
// (per second); curl: swirl strength (little: a soft glow, no marbling)
interface FluidOptions {
  ink?: number
  /** a single hue for all the colour poured (the smoke: blue-grey) */
  tint?: number[]
  /** colour resolution (the short side; less on a phone) */
  dye?: number
  fade?: number
  curl?: number
}

export function createFluid(
  canvas: HTMLCanvasElement,
  { ink = 1, tint, dye: dyeRes = DYE, fade = DYE_FADE, curl: swirl = CURL }: FluidOptions = {},
): Fluid | null {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false })
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) return null

  const progs = createPrograms(gl)
  const { target, double, free } = createTargets(gl)

  let velocity: Double, dye: Double, pressure: Double, divergence: Target, curl: Target
  const size = (res: number) => {
    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight
    return aspect >= 1 ? [Math.round(res * aspect), res] : [res, Math.round(res / aspect)]
  }
  let built = false
  const build = () => {
    if (built) {
      for (const d of [velocity, dye, pressure]) {
        free(d.read)
        free(d.write)
      }
      free(divergence)
      free(curl)
    }
    const [sw, sh] = size(SIM)
    const [dw, dh] = size(dyeRes)
    velocity = double(sw, sh)
    pressure = double(sw, sh)
    dye = double(dw, dh)
    divergence = target(sw, sh)
    curl = target(sw, sh)
    built = true
  }

  // draws a program into a target (or to the screen), with its textures and its values
  const run = (name: ProgName, to: Target | null, values: Record<string, number | number[] | Target>) => {
    const { p, u } = progs[name]
    gl.useProgram(p)
    const w = to ? to.w : gl.drawingBufferWidth
    const h = to ? to.h : gl.drawingBufferHeight
    if (u.texel) gl.uniform2f(u.texel, 1 / w, 1 / h)
    let unit = 0
    for (const [key, v] of Object.entries(values)) {
      if (!u[key]) continue
      if (typeof v === 'number') gl.uniform1f(u[key], v)
      else if (Array.isArray(v)) (v.length === 2 ? gl.uniform2fv : gl.uniform3fv).call(gl, u[key], v)
      else {
        gl.activeTexture(gl.TEXTURE0 + unit)
        gl.bindTexture(gl.TEXTURE_2D, v.tex)
        gl.uniform1i(u[key], unit++)
      }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, to ? to.fbo : null)
    gl.viewport(0, 0, w, h)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  const splat = (x: number, y: number, dx: number, dy: number, color: number[], radius: number) => {
    const aspect = canvas.width / canvas.height
    run('splat', velocity.write, { uTarget: velocity.read, aspect, point: [x, y], color: [dx, dy, 0], radius })
    velocity.swap()
    const amount = tint ? tint.map((t) => t * Math.max(...color)) : color
    run('splat', dye.write, { uTarget: dye.read, aspect, point: [x, y], color: amount.map((c) => c * ink), radius })
    dye.swap()
  }

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5)
    const w = Math.round(innerWidth * dpr)
    const h = Math.round(innerHeight * dpr)
    if (canvas.width === w && canvas.height === h && built) return
    canvas.width = w
    canvas.height = h
    build()
  }
  resize()

  // gestures to perform a bit later (crackles, 2nd explosion), counted in simulation time
  let clock = 0
  const queue: { at: number; fn: () => void }[] = []
  const later = (sec: number, fn: () => void) => queue.push({ at: clock + sec, fn })

  // a crown of sparks thrown out from (x, y): n drops, speed, starting radius, two alternating colours,
  // brightness, drop size; fall: a little falling (downward velocity)
  const ring = (
    x: number,
    y: number,
    n: number,
    speed: number,
    r: number,
    a: number[],
    b: number[],
    glow: number,
    radius: number,
    fall: number,
  ) => {
    const turn = Math.random() * Math.PI * 2
    const ratio = canvas.height / canvas.width
    for (let i = 0; i < n; i++) {
      const t = turn + (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.08
      const v = speed * (0.8 + Math.random() * 0.4)
      const col = (i % 2 ? a : b).map((c) => c * glow)
      splat(x + Math.cos(t) * r * ratio, y + Math.sin(t) * r, Math.cos(t) * v, Math.sin(t) * v + fall, col, radius)
    }
  }
  // crackles: tiny golden flashes, at random in a disc
  const crackle = (x: number, y: number, spread: number, n: number) => {
    const ratio = canvas.height / canvas.width
    for (let i = 0; i < n; i++) {
      const t = Math.random() * Math.PI * 2
      const d = spread * Math.sqrt(Math.random())
      const v = 40 + Math.random() * 60
      splat(
        x + Math.cos(t) * d * ratio,
        y + Math.sin(t) * d,
        Math.cos(t) * v,
        Math.sin(t) * v,
        GOLD.map((c) => c * 2.4),
        0.00009,
      )
    }
  }

  return {
    burst(cx, cy, size = 1, colors) {
      const x = cx / innerWidth
      const y = 1 - cy / innerHeight
      const pick = () => COLORS[Math.floor(Math.random() * COLORS.length)]
      const a = colors ? COLORS[colors[0]] : pick()
      let b = colors ? COLORS[colors[1]] : pick()
      while (!colors && b === a) b = pick()
      const kind = SHELLS[Math.floor(Math.random() * SHELLS.length)]
      const glow = 1.6 + Math.random() * 0.8
      // the starting flash: a hot, very dense core, spreading out
      splat(
        x,
        y,
        0,
        0,
        GOLD.map((c) => c * 2.2),
        0.0035 * size,
      )
      if (kind === 'willow') {
        // willow: many golden sparks, slower, falling back down
        ring(x, y, 40, 160 * size, 0.022 * size, GOLD, GOLD, glow, 0.0003 * size, -90 * size)
        later(0.5, () => crackle(x, y, 0.1 * size, 22))
        later(0.95, () => crackle(x, y - 0.05 * size, 0.13 * size, 18))
        return
      }
      ring(x, y, 34 + Math.floor(Math.random() * 12), 300 * size, 0.026 * size, a, b, glow, 0.00034 * size, 0)
      if (kind === 'chrysanthemum') {
        // a 2nd crown, smaller and slower, in another colour, then crackles
        ring(x, y, 22, 150 * size, 0.014 * size, b, b, glow, 0.00026 * size, 0)
        later(0.45, () => crackle(x, y, 0.12 * size, 26))
      } else if (kind === 'double') {
        // a second explosion, a bit later, in the other colour
        later(0.32, () => ring(x, y, 30, 230 * size, 0.02 * size, b, a, glow, 0.0003 * size, 0))
      }
    },
    step(dt) {
      clock += dt
      for (let i = queue.length - 1; i >= 0; i--) {
        if (queue[i].at <= clock) queue.splice(i, 1)[0].fn()
      }
      const simTexel = [1 / velocity.read.w, 1 / velocity.read.h]
      run('curl', curl, { uVelocity: velocity.read })
      run('vorticity', velocity.write, { uVelocity: velocity.read, uCurl: curl, curl: swirl, dt })
      velocity.swap()
      run('divergence', divergence, { uVelocity: velocity.read })
      run('scale', pressure.write, { uTexture: pressure.read, value: PRESSURE_FADE })
      pressure.swap()
      for (let i = 0; i < PRESSURE_STEPS; i++) {
        run('pressure', pressure.write, { uPressure: pressure.read, uDivergence: divergence })
        pressure.swap()
      }
      run('gradient', velocity.write, { uPressure: pressure.read, uVelocity: velocity.read })
      velocity.swap()
      run('advect', velocity.write, { uVelocity: velocity.read, uSource: velocity.read, simTexel, dt, fade: VEL_FADE })
      velocity.swap()
      run('advect', dye.write, { uVelocity: velocity.read, uSource: dye.read, simTexel, dt, fade })
      dye.swap()
      run('display', null, { uDye: dye.read })
    },
    resize,
    clear() {
      queue.length = 0
      for (const d of [velocity, dye, pressure]) {
        for (const t of [d.read, d.write]) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo)
          gl.clearColor(0, 0, 0, 0)
          gl.clear(gl.COLOR_BUFFER_BIT)
        }
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    },
    destroy() {
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
