import * as THREE from 'three'
import { FLOOR, type Spinner } from './spin'

// The gestures: pressing on a top (mouse, finger) pumps it; holding and sliding pushes it in the direction of the
// gesture (if it spins) — towards the top of the screen, it moves away. On the keyboard, on the last one touched:
// Space pumps it; the arrows push it (← → in width, ↑ ↓ in depth: ↑ moves it away). The hand only appears over a
// top. Returns the chosen top (the one that answers the keys).

export function controls(canvas: HTMLCanvasElement, camera: THREE.Camera, tops: Spinner[]) {
  let current = tops[0]
  const ray = new THREE.Raycaster()
  const screen = new THREE.Vector2()
  const aim = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    screen.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(screen, camera)
  }
  // the top under the mouse (or nothing)
  const hit = () => {
    const h = ray.intersectObjects(tops.map((t) => t.wobble), true)[0]
    return h ? tops.find((t) => t.wobble.getObjectById(h.object.id)) : undefined
  }
  // (otherwise, the closest to the spot aimed at on the table: the tops at the back are tiny)
  const table = new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR)
  const nearest = () => {
    const p = new THREE.Vector3()
    ray.ray.intersectPlane(table, p)
    return tops.reduce((a, b) => (Math.hypot(b.x - p.x, b.z - p.z) < Math.hypot(a.x - p.x, a.z - p.z) ? b : a))
  }

  let from: { x: number; y: number } | null = null
  canvas.addEventListener('pointerdown', (e) => {
    aim(e)
    // (the one being left is no longer pushed)
    current.pushX = current.pushZ = 0
    current = hit() ?? nearest()
    current.pressed = true
    from = { x: e.clientX, y: e.clientY }
    canvas.setPointerCapture(e.pointerId)
  })
  canvas.addEventListener('pointermove', (e) => {
    if (from) {
      // (sliding while holding: the push follows the gesture)
      const clamp = (v: number) => Math.max(-1, Math.min(1, v / 90))
      current.pushX = clamp(e.clientX - from.x)
      current.pushZ = clamp(e.clientY - from.y)
      return
    }
    aim(e)
    canvas.style.cursor = hit() ? 'pointer' : ''
  })
  const release = () => {
    if (from) current.pushX = current.pushZ = 0
    from = null
    for (const t of tops) t.pressed = false
  }
  canvas.addEventListener('pointerup', release)
  canvas.addEventListener('pointercancel', release)

  // the arrows push the top (← → in width, ↑ ↓ in depth)
  const arrow = (e: KeyboardEvent, on: number) => {
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]
    if (!d) return false
    if (d[0]) current.pushX = d[0] * on
    if (d[1]) current.pushZ = d[1] * on
    return true
  }
  addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault()
      if (!e.repeat) current.pressed = true
      return
    }
    if (arrow(e, 1)) e.preventDefault()
  })
  addEventListener('keyup', (e) => {
    if (e.key === ' ') current.pressed = false
    arrow(e, 0)
  })
  return () => current
}
