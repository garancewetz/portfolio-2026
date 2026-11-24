import * as THREE from 'three'

// The pieces every Kit mascot is built from: one glossy finish (a toy's clear varnish), and the face (eyes with a
// catch-light, cheeks, a smile) placed on the front of the body.

export const INK = 0x1e2533

export type Mascot = { root: THREE.Group; eyes: THREE.Object3D[]; update: (t: number) => void }
type Placement = { position?: number[]; scale?: number[]; rotation?: number[] }
type Ellipsoid = [radii: number[], centre: number[]]

export const sphere = new THREE.SphereGeometry(1, 64, 48)

export function material(color: THREE.ColorRepresentation, extra: THREE.MeshPhysicalMaterialParameters = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.25, ...extra })
}

export function mesh(geometry: THREE.BufferGeometry, mat: THREE.Material, { position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0] }: Placement = {}) {
  const object = new THREE.Mesh(geometry, mat)
  object.position.set(position[0], position[1], position[2])
  object.scale.set(scale[0], scale[1], scale[2])
  object.rotation.set(rotation[0], rotation[1], rotation[2])
  return object
}

// the depth of an ellipsoid's front surface at (x, y): where a painted-on feature has to sit to show
export function frontZ([[rx, ry, rz], [cx, cy, cz]]: Ellipsoid, x: number, y: number) {
  const nx = (x - cx) / rx
  const ny = (y - cy) / ry
  return cz + rz * Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))
}

// two glossy eyes with a catch-light each; returned so that the stage can blink them
export function addEyes(parent: THREE.Object3D, { x, y, z, size }: { x: number; y: number; z: number; size: number }) {
  return [-1, 1].map((side) => {
    const eye = new THREE.Group()
    eye.position.set(side * x, y, z)
    eye.add(mesh(sphere, material(0x10131c, { roughness: 0.15, clearcoat: 1 }), { scale: [size, size * 1.3, size * 0.7] }))
    eye.add(mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xffffff }), { position: [-size * 0.3, size * 0.45, size * 0.62], scale: [size * 0.32, size * 0.32, size * 0.2] }))
    parent.add(eye)
    return eye
  })
}

export function addSmile(parent: THREE.Object3D, { y, z, radius }: { y: number; z: number; radius: number }) {
  parent.add(mesh(new THREE.TorusGeometry(radius, radius * 0.16, 12, 32, Math.PI), material(INK), { position: [0, y, z], rotation: [0, 0, Math.PI] }))
}

export function addCheeks(parent: THREE.Object3D, { x, y, z, size, tilt = 0 }: { x: number; y: number; z: number; size: number; tilt?: number }) {
  for (const side of [-1, 1])
    parent.add(mesh(sphere, material(0xff8a94, { transparent: true, opacity: 0.75, roughness: 0.8, clearcoat: 0 }), { position: [side * x, y, z], scale: [size, size * 0.6, size * 0.25], rotation: [0, side * tilt, 0] }))
}

// a word printed on a part (the ticket's « TEC »)
export function labelTexture(text: string, background: string, ink: string) {
  const canvas = Object.assign(document.createElement('canvas'), { width: 256, height: 128 })
  const context = canvas.getContext('2d')!
  context.fillStyle = background
  context.fillRect(0, 0, 256, 128)
  context.fillStyle = ink
  context.font = '800 64px -apple-system, system-ui, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, 128, 68)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
