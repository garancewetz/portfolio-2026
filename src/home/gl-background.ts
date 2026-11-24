// The WebGL backdrop engine: a single full-screen shader, driven by numbers and colours. Going from one project to
// another means gliding these settings: the backdrop transforms. It only redraws while gliding, unless it is
// `animated` (the drift of a project page, the falling snow).
// Settings: a number → float, [a, b] → vec2, '#rrggbb' → vec3. The shader also gets `res` and `time`.
// Options:
// · textures: { sampler2D name: image URL } (read as is, no smoothing nor colour conversion); the first one loads at
//   once, the others on demand (loadAll(), or loaded(name) for one of them);
// · ready: called when the backdrop can be seen (its first image arrived), to fade it in rather than show it flat;
// · duration: the time of a glide (ms);
// · scale: the resolution, relative to the screen's. It adapts: if drawing lags (over 32 ms a frame on average), the
//   backdrop draws smaller, down to 0.25; and never more than MAX_PIXELS.
// Without WebGL, it returns an engine that does nothing (the page works, without a backdrop).

// a setting: a number (float), two (vec2), or a colour '#rrggbb' (vec3)
export type Value = number | number[] | string
export type Settings = Record<string, Value>
type Numbers = Record<string, number | number[]>
export type Backdrop = {
  loadAll: () => Promise<void>
  loaded: (name: string) => Promise<void>
  set: (key: string, v: number | number[]) => void
  animate: (v: boolean) => void
  goTo: (settings: Settings) => void
}
export type BackdropOptions = {
  animated?: boolean
  scale?: number
  textures?: Record<string, string>
  duration?: number
  ready?: () => void
}

export function glBackground(canvas: HTMLCanvasElement, FS: string, start: Settings, options: BackdropOptions = {}): Backdrop {
  let { animated = false, scale = 0.6 } = options
  const { textures = {}, duration = 1600, ready = () => {} } = options
  const context = canvas.getContext('webgl')
  if (!context) {
    ready()
    return { loadAll: () => Promise.resolve(), loaded: () => Promise.resolve(), set() {}, animate() {}, goTo() {} }
  }
  const gl: WebGLRenderingContext = context
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s))
    return s
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }'))
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS))
  gl.linkProgram(prog)
  gl.useProgram(prog)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const a = gl.getAttribLocation(prog, 'a')
  gl.enableVertexAttribArray(a)
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0)

  // the images (heights): one texture unit each; the backdrop redraws when one arrives
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
  const images = Object.entries(textures).map(([name, url], unit) => {
    const tex = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v)
    gl.uniform1i(gl.getUniformLocation(prog, name), unit)
    return { url, unit, tex }
  })
  let loading = 0                     // images on their way (the resolution does not adapt meanwhile: see pace)
  const promises: Promise<void>[] = []
  function loadOne(k: number) {
    const { url, unit, tex } = images[k]
    return (promises[k] ||= new Promise<void>((done) => {
      loading++
      const settle = () => { setTimeout(() => { loading-- }, 1000); done() }
      // decoded off the main thread (createImageBitmap), so scrolling never freezes; as is, no colour correction
      fetch(url).then((r) => r.blob())
        .then((b) => createImageBitmap(b, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }))
        .then((img) => {
          gl.activeTexture(gl.TEXTURE0 + unit)
          gl.bindTexture(gl.TEXTURE_2D, tex)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
          request()
          settle()
        })
        .catch((err) => { console.error('relief not loaded:', url, err); settle() })   // the place stays flat; the others still load
    }))
  }
  let all: Promise<void> | null = null
  const loadAll = () => (all ||= images.reduce((p, _, k) => p.then(() => loadOne(k)), Promise.resolve()))
  const loaded = (name: string) => { const k = Object.keys(textures).indexOf(name); return k < 0 ? Promise.resolve() : loadOne(k) }
  if (images.length) {
    const fallback = setTimeout(ready, 4000)          // at worst, the backdrop shows after 4 s
    loadOne(0).then(() => { clearTimeout(fallback); ready() })
  } else ready()

  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  const toNumbers = (r: Settings): Numbers => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'string' ? rgb(v) : v]))
  const U: Record<string, WebGLUniformLocation | null> = Object.fromEntries(['res', 'time', ...Object.keys(start)].map((n) => [n, gl.getUniformLocation(prog, n)]))
  let state = toNumbers(start), target = state, t0 = performance.now()

  // the pace: the gap between two frames drawn in a row. Too slow for long (two series in a row): draw smaller; smooth
  // again: back up, to the wanted scale. Not while images load (decoding slows a moment, not the backdrop).
  const wantedScale = scale
  let previous = 0, gaps: number[] = [], changedAt = 0, slow = 0
  function pace() {
    const now = performance.now(), dt = now - previous
    previous = now
    if (dt > 200 || loading > 0) { gaps = []; return }
    gaps.push(dt)
    if (gaps.length < 20) return
    const mean = gaps.reduce((a, b) => a + b) / gaps.length
    gaps = []
    if (now - changedAt < 2000) return
    slow = mean > 32 ? slow + 1 : 0
    if (slow >= 2 && scale > .25) { changedAt = now; slow = 0; scale = Math.max(.25, scale * .8); resize() }
    else if (mean < 17 && scale < wantedScale) { changedAt = now; scale = Math.min(wantedScale, scale * 1.25); resize() }
  }

  function draw() {
    pace()
    gl.uniform2f(U.res, canvas.width, canvas.height)
    gl.uniform1f(U.time, (performance.now() - t0) / 1000)
    for (const [k, v] of Object.entries(state)) {
      if (!(k in U)) U[k] = gl.getUniformLocation(prog, k) // a setting added on the way
      if (!U[k]) continue
      if (!Array.isArray(v)) gl.uniform1f(U[k], v)
      else if (v.length === 2) gl.uniform2fv(U[k], v)
      else gl.uniform3fv(U[k], v)
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  // never more than MAX_PIXELS: on a large Retina screen the (soft, hazy) backdrop gains nothing, and it lagged
  const MAX_PIXELS = 1.6e6
  function resize() {
    const R = Math.min(Math.min(devicePixelRatio, 2) * scale, Math.sqrt(MAX_PIXELS / (innerWidth * innerHeight)))
    canvas.width = Math.round(innerWidth * R)
    canvas.height = Math.round(innerHeight * R)
    gl.viewport(0, 0, canvas.width, canvas.height)
    draw()
  }

  // gliding from one set of settings to another: it starts and stops softly (never a jolt), over `duration` ms,
  // from wherever it was when the target changed
  let from = state, startedAt = 0
  const ease = (x: number) => x * x * x * (x * (x * 6 - 15) + 10)
  const mix = (a: number | number[], b: number | number[], k: number) =>
    Array.isArray(a) ? a.map((x, i) => x + ((b as number[])[i] - x) * k) : a + ((b as number) - a) * k
  // a single frame loop at a time
  let requested = false
  const request = () => { if (!requested) { requested = true; requestAnimationFrame(frame) } }
  function frame() {
    requested = false
    const k = ease(Math.min(1, (performance.now() - startedAt) / duration))
    const next: Numbers = {}
    for (const n in target) next[n] = mix(from[n], target[n], k)
    state = next
    draw()
    if (k < 1 || animated) request()
  }
  addEventListener('resize', resize)
  resize()
  if (animated) request()
  return {
    loadAll,
    loaded,
    // set one setting right away (driven by scrolling: no glide, it follows the finger); one frame at most per
    // display frame, even if scrolling sends several events
    set(key, v) {
      state = { ...state, [key]: v }
      target = { ...target, [key]: v }
      from = { ...from, [key]: v }
      request()
    },
    // draw continuously (true) or only on demand (false)
    animate(v) {
      if (v === animated) return
      animated = v
      if (animated) request()
    },
    goTo(settings) {
      from = state
      startedAt = performance.now()
      target = toNumbers(settings)
      request()
    },
  }
}
