// Le moteur du feu d'artifice liquide : une simulation de fluide en WebGL2 (« stable fluids » : la vitesse du
// liquide est transportée par elle-même, rendue sans divergence, avec un peu de tourbillon en plus), dans laquelle
// on verse de la couleur. Une gerbe = des gouttes de couleur projetées en étoile depuis un point ; le liquide les
// étire, les enroule, puis la couleur se dissout dans le fond papier.
// Chargé seulement quand on allume le mode (voir Fireworks.tsx).

const SIM = 128 // résolution de la vitesse (le petit côté)
const DYE = 640 // résolution de la couleur (le petit côté)
const DYE_FADE = 0.55 // la couleur se dissout (par seconde ; réglable, voir createFluid)
const VEL_FADE = 0.35 // le liquide se calme (par seconde)
const PRESSURE_FADE = 0.8
const PRESSURE_STEPS = 20
const CURL = 22 // force des tourbillons (réglable, voir createFluid)
// les sortes de gerbes : pivoine (une couronne, deux couleurs), chrysanthème (deux couronnes et des crépitements),
// double (une 2e explosion juste après), saule (doré, qui retombe)
const SHELLS = ['peony', 'chrysanthemum', 'double', 'willow', 'chrysanthemum'] as const
const GOLD = [1, 0.78, 0.32]

// les couleurs des captures des projets (les mêmes, dans le même ordre, que les étincelles : voir show.ts) (le bleu de Signe, le vert de Synapso, le rose de Trans-trame…)
const COLORS: [number, number, number][] = [
  [0.49, 0.36, 0.84], // violet de la grille
  [0.84, 0.36, 0.59], // rose
  [0.24, 0.48, 0.88], // bleu
  [0.18, 0.64, 0.42], // vert
  [0.94, 0.54, 0.24], // orange
  [0.91, 0.73, 0.19], // or
]

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv, vL, vR, vT, vB;
uniform vec2 texel;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(texel.x, 0.0);
  vR = vUv + vec2(texel.x, 0.0);
  vT = vUv + vec2(0.0, texel.y);
  vB = vUv - vec2(0.0, texel.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const HEAD = `#version 300 es
precision highp float;
in vec2 vUv, vL, vR, vT, vB;
out vec4 o;
`

const FRAG = {
  splat: `${HEAD}
uniform sampler2D uTarget;
uniform float aspect, radius;
uniform vec3 color;
uniform vec2 point;
void main() {
  vec2 p = vUv - point;
  p.x *= aspect;
  o = vec4(texture(uTarget, vUv).xyz + exp(-dot(p, p) / radius) * color, 1.0);
}`,
  advect: `${HEAD}
uniform sampler2D uVelocity, uSource;
uniform vec2 simTexel;
uniform float dt, fade;
void main() {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * simTexel;
  o = texture(uSource, coord) / (1.0 + fade * dt);
}`,
  divergence: `${HEAD}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).x, R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y, B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`,
  curl: `${HEAD}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y, R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x, B = texture(uVelocity, vB).x;
  o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`,
  vorticity: `${HEAD}
uniform sampler2D uVelocity, uCurl;
uniform float curl, dt;
void main() {
  float L = texture(uCurl, vL).x, R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x, B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 v = texture(uVelocity, vUv).xy + force * dt;
  o = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
}`,
  pressure: `${HEAD}
uniform sampler2D uPressure, uDivergence;
void main() {
  float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
  o = vec4((L + R + B + T - texture(uDivergence, vUv).x) * 0.25, 0.0, 0.0, 1.0);
}`,
  gradient: `${HEAD}
uniform sampler2D uPressure, uVelocity;
void main() {
  float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
  o = vec4(texture(uVelocity, vUv).xy - vec2(R - L, T - B), 0.0, 1.0);
}`,
  scale: `${HEAD}
uniform sampler2D uTexture;
uniform float value;
void main() { o = value * texture(uTexture, vUv); }`,
  // la couleur posée sur le fond papier, comme de l'encre : transparente là où il n'y en a pas, vive là où elle
  // est dense (alpha prémultiplié)
  display: `${HEAD}
uniform sampler2D uDye;
void main() {
  vec3 c = texture(uDye, vUv).rgb;
  float a = clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0);
  a = a * a * (3.0 - 2.0 * a) * 0.92;
  vec3 col = c / max(max(c.r, max(c.g, c.b)), 0.0001);
  o = vec4(col * a, a);
}`,
}

type ProgName = keyof typeof FRAG

interface Target {
  tex: WebGLTexture
  fbo: WebGLFramebuffer
  w: number
  h: number
}
interface Double {
  read: Target
  write: Target
  swap(): void
}

export interface Fluid {
  /** une gerbe, centrée en (x, y) (px CSS, dans la fenêtre) */
  burst(x: number, y: number, size?: number, colors?: [number, number]): void
  /** une image : le liquide avance de dt secondes, puis s'affiche */
  step(dt: number): void
  resize(): void
  clear(): void
  destroy(): void
}

// ink : la quantité de couleur versée (1 : pleine ; moins : un halo léger, sous les étincelles) ; fade : vitesse à
// laquelle elle se dissout (par seconde) ; curl : force des tourbillons (peu : une lueur douce, pas de marbrures)
interface FluidOptions {
  ink?: number
  /** une seule teinte pour toute la couleur versée (la fumée : gris-bleu) */
  tint?: number[]
  /** résolution de la couleur (le petit côté ; moins sur un téléphone) */
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

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
    return s
  }
  const vert = compile(gl.VERTEX_SHADER, VERT)
  const progs = {} as Record<ProgName, { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }>
  for (const name of Object.keys(FRAG) as ProgName[]) {
    const p = gl.createProgram()!
    gl.attachShader(p, vert)
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, FRAG[name]))
    gl.bindAttribLocation(p, 0, 'aPos')
    gl.linkProgram(p)
    const u: Record<string, WebGLUniformLocation | null> = {}
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS)
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(p, i)!.name
      u[name] = gl.getUniformLocation(p, name)
    }
    progs[name] = { p, u }
  }

  // un grand triangle qui couvre tout
  const vbo = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  const target = (w: number, h: number): Target => {
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null)
    const fbo = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    gl.viewport(0, 0, w, h)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    return { tex, fbo, w, h }
  }
  const double = (w: number, h: number): Double => {
    const d = {
      read: target(w, h),
      write: target(w, h),
      swap() {
        const t = d.read
        d.read = d.write
        d.write = t
      },
    }
    return d
  }
  const free = (t: Target) => {
    gl.deleteTexture(t.tex)
    gl.deleteFramebuffer(t.fbo)
  }

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

  // dessine un programme dans une cible (ou à l'écran), avec ses textures et ses valeurs
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

  // des gestes à faire un peu plus tard (crépitements, 2e explosion), comptés en temps de simulation
  let clock = 0
  const queue: { at: number; fn: () => void }[] = []
  const later = (sec: number, fn: () => void) => queue.push({ at: clock + sec, fn })

  // une couronne d'étincelles projetées depuis (x, y) : n gouttes, vitesse, rayon de départ, deux couleurs en
  // alternance, éclat, taille d'une goutte ; fall : un peu de chute (vitesse vers le bas)
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
  // des crépitements : de minuscules éclats dorés, au hasard dans un disque
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
      // l'éclair du départ : un cœur chaud, très dense, qui s'étale
      splat(
        x,
        y,
        0,
        0,
        GOLD.map((c) => c * 2.2),
        0.0035 * size,
      )
      if (kind === 'willow') {
        // saule : beaucoup d'étincelles dorées, plus lentes, qui retombent
        ring(x, y, 40, 160 * size, 0.022 * size, GOLD, GOLD, glow, 0.0003 * size, -90 * size)
        later(0.5, () => crackle(x, y, 0.1 * size, 22))
        later(0.95, () => crackle(x, y - 0.05 * size, 0.13 * size, 18))
        return
      }
      ring(x, y, 34 + Math.floor(Math.random() * 12), 300 * size, 0.026 * size, a, b, glow, 0.00034 * size, 0)
      if (kind === 'chrysanthemum') {
        // une 2e couronne, plus petite et plus lente, d'une autre couleur, puis des crépitements
        ring(x, y, 22, 150 * size, 0.014 * size, b, b, glow, 0.00026 * size, 0)
        later(0.45, () => crackle(x, y, 0.12 * size, 26))
      } else if (kind === 'double') {
        // une seconde explosion, un peu plus tard, dans l'autre couleur
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
