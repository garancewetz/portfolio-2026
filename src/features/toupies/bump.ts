import * as THREE from 'three'
import { FLOOR, type Spinner } from './spin'

// Les chocs : les bords de l'écran renvoient les toupies, quelle que soit la vue (de côté : sur les côtés, et devant ;
// au fond, elles peuvent partir très loin, vers l'horizon, toutes petites ; de dessus : les quatre côtés), et deux
// toupies ne se traversent pas (leurs rebords se touchent) : elles échangent leur élan le long de la ligne qui les
// joint. Et elles se frottent : tant qu'elles se touchent, celle qui tourne vite entraîne l'autre (ce qu'elle lui
// donne, elle le perd, et un peu plus) — une toupie couchée, frottée par une toupie lancée, se met à tourner et se
// relève ; et leurs rebords, qui filent en sens contraires au point de contact, les écartent l'une de l'autre de côté.

// (au fond, la limite de la page : très loin)
const BACK = -150
// (la part d'écart de vitesse rattrapée par seconde de contact, et celle qui se perd en chaleur)
const RUB = 2.5
const LOSS = 0.25
// (la distance en deçà de laquelle deux rebords se touchent)
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
      // (elles se frottent dès que leurs rebords se touchent, même sans se presser)
      if (d >= reach + TOUCH) continue
      const nx = dx / d
      const nz = dz / d
      const gap = a.omega - b.omega
      const given = gap * (1 - Math.exp(-RUB * dt)) * 0.5
      a.omega -= given * (gap > 0 ? 1 + LOSS : 1 - LOSS)
      b.omega += given * (gap > 0 ? 1 - LOSS : 1 + LOSS)
      // (au point de contact, leurs rebords filent en sens contraires : chacune est poussée de côté, à l'opposé de
      // l'autre ; elles glissent l'une contre l'autre)
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

// les bords de l'écran : là où la toupie est posée, vue par la caméra (de -1 à 1 en largeur et en hauteur), moins
// son rebord ; elle n'est renvoyée que si elle va vers le dehors (une toupie déjà dehors, quand on change de vue,
// peut toujours revenir)
const at = new THREE.Vector3()
const off = new THREE.Vector3()
function edges(a: Spinner, camera: THREE.Camera) {
  at.set(a.x, FLOOR, a.z).project(camera)
  // (avec un peu de marge : la toupie reste entière, sa pompe et son ombre comprises)
  const rx = 1.2 * Math.abs(off.set(a.x + a.rim, FLOOR, a.z).project(camera).x - at.x)
  const ry = 1.4 * Math.abs(off.set(a.x, FLOOR, a.z + a.rim).project(camera).y - at.y)
  if ((at.x > 1 - rx && a.vx > 0) || (at.x < rx - 1 && a.vx < 0)) {
    a.x = a.px
    a.vx *= -0.5
  }
  // (en bas de l'écran, c'est vers nous ; en haut, vers le fond)
  if ((at.y < ry - 1 && a.vz > 0) || ((at.y > 1 - ry || a.z < BACK) && a.vz < 0)) {
    a.z = a.pz
    a.vz *= -0.5
  }
}
