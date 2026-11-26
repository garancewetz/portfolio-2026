import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { Look } from './looks'
import { blobShadow } from './parts'

// The looks' little stages: a studio light (a room reflected in the varnish, a key light, a cool rim), a soft shadow
// on the floor. Pousse floats, sways, blinks now and then, as when it speaks in Kit; still (for whoever asked for less
// motion), it holds one pose. A browser allows only about sixteen WebGL contexts, and fourteen looks would each build
// their own light: so one renderer, out of the page, draws every look in turn, and each look's canvas (a plain 2D one)
// receives a copy of its picture. Only the looks on screen are drawn.

const BLINK = 0.16
const STILL_AT = 1.05
// a change of outfit: a hop on the spot, up and down, a parabola; the outfit changes at the top, it never grows
const HOP = 0.48
const HOP_HEIGHT = 0.3
const hopAt = (progress: number) => (progress >= 1 ? 0 : HOP_HEIGHT * (1 - (progress * 2 - 1) ** 2))

let renderer: THREE.WebGLRenderer | null = null
let environment: THREE.Texture | null = null
function shared() {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(1) // (sizes below are in device pixels already)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x000000, 0)
    renderer.setScissorTest(true)
    const pmrem = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    environment = pmrem.fromScene(room, 0.04).texture
    pmrem.dispose()
    room.dispose()
  }
  return { renderer, environment: environment! }
}

type Stage = { draw: (now: number) => void; visible: boolean; dirty: boolean }
const stages = new Set<Stage>()
let frame = 0
let still = false
function tick(now: number) {
  frame = 0
  let any = false
  for (const s of stages) {
    if (!s.visible || (still && !s.dirty)) continue
    s.dirty = false
    s.draw(now)
    any = true
  }
  if (any && !still) request()
}
const request = () => {
  if (!frame) frame = requestAnimationFrame(tick)
}

// room: how much more space there is around Pousse than in a card (the canvas is that much bigger and the camera that
// much further back: Pousse keeps its size, what it holds or throws has room, never cut)
export function stage(canvas: HTMLCanvasElement, look: Look, isStill: boolean, room = 1) {
  still = isStill
  const { renderer, environment } = shared()
  const context = canvas.getContext('2d')!
  const scene = new THREE.Scene()
  scene.environment = environment
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c4d8, 1.2))
  const key = new THREE.DirectionalLight(0xffffff, 2.2)
  key.position.set(-2, 3, 4)
  const rim = new THREE.DirectionalLight(0xcfe6ff, 1.6)
  rim.position.set(2.5, 1.5, -3)
  scene.add(key, rim)
  // close enough that Pousse fills its card, as in Kit's reference (what it throws may leave the card)
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
  camera.position.set(0, 0.35, 5.6 * room)
  camera.lookAt(0, 0.22, 0)
  const holder = new THREE.Group()
  holder.add(look.root)
  scene.add(holder, blobShadow())
  // the look it wears, and the one it changes into at the top of its next hop
  let current = look
  let next: Look | null = null
  let hopStart = -1

  // (each starts at another moment, so that they do not move in step)
  const offset = Math.random() * 10
  let nextBlink = 0
  const size = new THREE.Vector2()
  const draw = (now: number) => {
    const t = still ? STILL_AT : now / 1000 + offset
    // its canvas, in device pixels (resized only when its place changes size)
    const ratio = Math.min(devicePixelRatio, 2)
    const w = Math.round(canvas.clientWidth * ratio)
    const h = Math.round(canvas.clientHeight * ratio)
    if (!w || !h) return
    if (canvas.width !== w || canvas.height !== h) Object.assign(canvas, { width: w, height: h })
    // the shared renderer only ever grows, to the largest stage
    renderer.getSize(size)
    if (size.x < w || size.y < h) renderer.setSize(Math.max(size.x, w), Math.max(size.y, h), false)
    renderer.getSize(size)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    const float = current.float ?? 1
    const hop = hopStart < 0 ? 1 : (now / 1000 - hopStart) / HOP
    if (next && hop >= 0.5) {
      holder.remove(current.root)
      holder.add(next.root)
      current = next
      next = null
    }
    if (hop >= 1) hopStart = -1
    holder.position.y = Math.sin(t * 2.2) * 0.07 * float + hopAt(hop)
    holder.rotation.y = still ? -0.32 : Math.sin(t * 0.7) * 0.4
    holder.rotation.z = Math.sin(t * 1.3) * 0.04 * float
    // a blink: the eyes close and open in 0.16 s, every 2 to 5 s
    if (!still && t > nextBlink + BLINK) nextBlink = t + 2 + Math.random() * 3
    const phase = (t - nextBlink) / BLINK
    const open = still || phase < 0 || phase > 1 ? 1 : Math.max(0.08, Math.abs(phase * 2 - 1))
    current.update(t, open)
    // drawn in the bottom left corner of the shared picture, then copied (the picture's rows start at its top)
    renderer.setViewport(0, 0, w, h)
    renderer.setScissor(0, 0, w, h)
    renderer.render(scene, camera)
    context.clearRect(0, 0, w, h)
    context.drawImage(renderer.domElement, 0, size.y - h, w, h, 0, 0, w, h)
  }
  const s: Stage = { draw, visible: false, dirty: true }
  stages.add(s)
  // drawn only while on screen; still, drawn again only when its place changes size
  new IntersectionObserver(([entry]) => {
    s.visible = entry.isIntersecting
    s.dirty = true
    if (s.visible) request()
  }).observe(canvas)
  new ResizeObserver(() => {
    s.dirty = true
    request()
  }).observe(canvas)
  return {
    // another outfit: a hop, and the change at its top (at once, for whoever asked for less motion)
    wear(look: Look) {
      if (still) {
        holder.remove(current.root)
        holder.add(look.root)
        current = look
      } else {
        next = look
        hopStart = performance.now() / 1000
      }
      s.dirty = true
      request()
    },
  }
}
