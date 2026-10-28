import * as THREE from 'three'
import { FLOOR, type Spinner } from './spin'

// Les gestes : appuyer sur une toupie (souris, doigt) la pompe ; en gardant appuyé et en glissant, on la pousse dans
// le sens du geste (si elle tourne) — vers le haut de l'écran, elle s'éloigne. Au clavier, sur la dernière touchée :
// Espace la pompe ; les flèches la poussent (← → en largeur, ↑ ↓ en profondeur : ↑ l'éloigne). La main n'apparaît
// qu'au-dessus d'une toupie. Renvoie la toupie choisie (celle qui répond aux touches).

export function controls(canvas: HTMLCanvasElement, camera: THREE.Camera, tops: Spinner[]) {
  let current = tops[0]
  const ray = new THREE.Raycaster()
  const screen = new THREE.Vector2()
  const aim = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    screen.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(screen, camera)
  }
  // la toupie sous la souris (ou rien)
  const hit = () => {
    const h = ray.intersectObjects(tops.map((t) => t.wobble), true)[0]
    return h ? tops.find((t) => t.wobble.getObjectById(h.object.id)) : undefined
  }
  // (sinon, la plus proche de l'endroit visé sur la table : les toupies du fond sont toutes petites)
  const table = new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR)
  const nearest = () => {
    const p = new THREE.Vector3()
    ray.ray.intersectPlane(table, p)
    return tops.reduce((a, b) => (Math.hypot(b.x - p.x, b.z - p.z) < Math.hypot(a.x - p.x, a.z - p.z) ? b : a))
  }

  let from: { x: number; y: number } | null = null
  canvas.addEventListener('pointerdown', (e) => {
    aim(e)
    // (celle qu'on quitte n'est plus poussée)
    current.pushX = current.pushZ = 0
    current = hit() ?? nearest()
    current.pressed = true
    from = { x: e.clientX, y: e.clientY }
    canvas.setPointerCapture(e.pointerId)
  })
  canvas.addEventListener('pointermove', (e) => {
    if (from) {
      // (glisser en gardant appuyé : la poussée suit le geste)
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

  // les flèches poussent la toupie (← → en largeur, ↑ ↓ en profondeur)
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
