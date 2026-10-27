import * as THREE from 'three'
import { LAMPS } from './motifs'

// une tache de lumière douce posée sur la page (sa couleur glisse d'une lampe à l'autre en tournant)
export function lightPool() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255,255,255,0.9)')
  grad.addColorStop(0.45, 'rgba(255,255,255,0.35)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  const material = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(c),
    transparent: true,
    opacity: 0,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 5.5), material)
  mesh.rotation.x = -Math.PI / 2
  const colors = LAMPS.map((h) => new THREE.Color(h))
  return {
    mesh,
    set(light: number, angle: number) {
      const k = ((angle / (Math.PI * 2)) * 0.5) % colors.length
      const n = Math.floor(k)
      material.color.copy(colors[n % colors.length]).lerp(colors[(n + 1) % colors.length], k % 1)
      material.opacity = light * 0.9
    },
  }
}

