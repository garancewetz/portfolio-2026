import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// The light every creature is seen in, in its place and in the sky alike (it does not change when it flies off): a room
// reflected in the varnish, a blue sky light, a key light, a cool rim.
export function studio(renderer: THREE.WebGLRenderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  scene.environment = pmrem.fromScene(room, 0.04).texture
  pmrem.dispose()
  room.dispose()
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a4cff, 0.9))
  const key = new THREE.DirectionalLight(0xffffff, 2.2)
  key.position.set(-2, 3, 4)
  const rim = new THREE.DirectionalLight(0xcfe6ff, 1.6)
  rim.position.set(2.5, 1.5, -3)
  scene.add(key, rim)
  return scene
}

// Keep a renderer's drawing buffer at its canvas's size (checked every frame, reallocated only when it changes)
export function fit(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, w: number, h: number) {
  const size = renderer.getSize(new THREE.Vector2())
  if (size.x === w && size.y === h) return
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

// A creature at home, in its place in the line: it sways, and lives its life (hops, bounces…); drawn only while it is
// there and on screen. Tells the sky (sky.ts) how it stands and how many pixels a unit is here, so that a freed
// creature leaves its place exactly as it was.
export function stage(canvas: HTMLCanvasElement, piece: { object: THREE.Group; update: (t: number) => void }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  const scene = studio(renderer)
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
  camera.position.set(0, 0.5, 6.8)
  const aim = new THREE.Vector3(0, 0.25, 0)
  camera.lookAt(aim)
  const holder = new THREE.Group()
  holder.add(piece.object)
  scene.add(holder)
  // hovered, it stops swaying and turns to face us
  let looking = false
  let previous = 0
  let seen = true
  let running = false
  const render = (now: number) => {
    if (!seen || !holder.visible) {
      running = false
      previous = 0
      return
    }
    const t = now / 1000
    fit(renderer, camera, canvas.clientWidth, canvas.clientHeight)
    const dt = Math.min(0.05, previous ? t - previous : 0.016)
    previous = t
    const sway = looking ? 0 : Math.sin(t * 0.6) * 0.45
    holder.rotation.y += (sway - holder.rotation.y) * (1 - Math.exp(-5 * dt))
    piece.update(t)
    renderer.render(scene, camera)
    requestAnimationFrame(render)
  }
  const wake = () => {
    if (running || !seen || !holder.visible) return
    running = true
    requestAnimationFrame(render)
  }
  new IntersectionObserver(([e]) => {
    seen = e.isIntersecting
    wake()
  }).observe(canvas)
  wake()
  return {
    piece,
    // (out: its place is left empty, and nothing is drawn there)
    show(v: boolean) {
      holder.visible = v
      if (!v) renderer.clear()
      wake()
    },
    look: (v: boolean) => (looking = v),
    turn: () => holder.rotation.y,
    pixelsPerUnit: () => canvas.clientHeight / (2 * Math.tan((15 * Math.PI) / 180) * camera.position.distanceTo(aim)),
  }
}
export type Home = ReturnType<typeof stage>
