// La plomberie WebGL2 du liquide (voir fluid.ts) : les programmes compilés, avec leurs valeurs, et les cibles où
// dessiner (une texture et son framebuffer ; doubles, pour lire l'une en écrivant l'autre).
import { FRAG, VERT, type ProgName } from './shaders'

export interface Target {
  tex: WebGLTexture
  fbo: WebGLFramebuffer
  w: number
  h: number
}
export interface Double {
  read: Target
  write: Target
  swap(): void
}
export type Programs = Record<ProgName, { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }>

export function createPrograms(gl: WebGL2RenderingContext): Programs {
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
    return s
  }
  const vert = compile(gl.VERTEX_SHADER, VERT)
  const progs = {} as Programs
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
  return progs
}

export function createTargets(gl: WebGL2RenderingContext) {
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
  return { target, double, free }
}
