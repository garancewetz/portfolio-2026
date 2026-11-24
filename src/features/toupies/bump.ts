import * as THREE from 'three'
import { FLOOR, type Spinner } from './spin'

// The collisions: the screen edges bounce the tops back, whatever the view (from the side: on the sides, and in
// front; at the back, they can go very far, towards the horizon, tiny; from above: all four sides), and two tops
// do not pass through each other (their rims touch): they exchange their momentum along the line joining them.
// And they rub: as long as they touch, the one spinning fast drags the other along (what it gives, it loses, and
// a little more) — a top lying down, rubbed by a spinning top, starts spinning and stands back up; and their
// rims, running in opposite directions at the contact point, push them apart sideways.

// (at the back, the limit of the page: very far)
const BACK = -150
// (the share of the speed difference caught up per second of contact, and the share lost as heat)
const RUB = 2.5
const LOSS = 0.25
// (the distance under which two rims touch)
const TOUCH = 0.04

export function bump(tops: Spinner[], camera: THREE.Camera, dt: number) {
  camera.updateMatrixWorld()
  for (let i = 0; i < tops.length; i++) {
    const a = tops[i]
    edges(a, camera)
    for (let j = i + 1; j < tops.length; j++) {
      const b = tops[j]
      const dx = b.x - a.x
      const dz = b.z - a.z
      const d = Math.hypot(dx, dz) || 0.001
      const reach = a.rim + b.rim
      // (they rub as soon as their rims touch, even without pressing)
      if (d >= reach + TOUCH) continue
      const nx = dx / d
      const nz = dz / d
      const gap = a.omega - b.omega
      const given = gap * (1 - Math.exp(-RUB * dt)) * 0.5
      a.omega -= given * (gap > 0 ? 1 + LOSS : 1 - LOSS)
      b.omega += given * (gap > 0 ? 1 - LOSS : 1 + LOSS)
      // (at the contact point, their rims run in opposite directions: each one is pushed sideways, away from the
      // other; they slide against each other)
      const side = 0.02 * (a.omega + b.omega) * dt
      a.vx += side * nz
      a.vz -= side * nx
      b.vx -= side * nz
      b.vz += side * nx
      if (d >= reach) continue
      const overlap = (reach - d) / 2
      a.x -= nx * overlap
      a.z -= nz * overlap
      b.x += nx * overlap
      b.z += nz * overlap
      const closing = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz
      if (closing <= 0) continue
      const dv = closing * 0.9
      a.vx -= dv * nx
      a.vz -= dv * nz
      b.vx += dv * nx
      b.vz += dv * nz
    }
  }
}

// the screen edges: where the top stands, seen by the camera (from -1 to 1 in width and height), minus its rim;
// it is only bounced back if it is heading out (a top already outside, when the view changes, can always come
// back)
const at = new THREE.Vector3()
const off = new THREE.Vector3()
function edges(a: Spinner, camera: THREE.Camera) {
  at.set(a.x, FLOOR, a.z).project(camera)
  // (with a little margin: the top stays whole, its plunger and its shadow included)
  const rx = 1.2 * Math.abs(off.set(a.x + a.rim, FLOOR, a.z).project(camera).x - at.x)
  const ry = 1.4 * Math.abs(off.set(a.x, FLOOR, a.z + a.rim).project(camera).y - at.y)
  if ((at.x > 1 - rx && a.vx > 0) || (at.x < rx - 1 && a.vx < 0)) {
    a.x = a.px
    a.vx *= -0.5
  }
  // (at the bottom of the screen, it is towards us; at the top, towards the back)
  if ((at.y < ry - 1 && a.vz > 0) || ((at.y > 1 - ry || a.z < BACK) && a.vz < 0)) {
    a.z = a.pz
    a.vz *= -0.5
  }
}
