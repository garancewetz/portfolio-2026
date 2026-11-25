import * as THREE from 'three'

// The pieces Pousse and its props are made of: a soft skin for the body, a glossy finish for the things it holds,
// two eyes that blink, a painted smile, blushing cheeks. pousse.ts puts them together.

export const INK = 0x1e2533

export type Vec3 = [number, number, number]
type Placement = { position?: Vec3; scale?: Vec3; rotation?: Vec3 }
// an ellipsoid as [radii, centre]
export type Ellipsoid = [radii: Vec3, centre: Vec3]

export function material(color: THREE.ColorRepresentation, extra: THREE.MeshPhysicalMaterialParameters = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.25, ...extra })
}

// a living thing's skin: matte and soft, a fine velvet catching the light on its edges; only the eyes keep a gloss
export function skin(color: THREE.ColorRepresentation, velvet = 0.55) {
  const tint = new THREE.Color(color)
  return new THREE.MeshPhysicalMaterial({
    color: tint,
    roughness: 0.78,
    clearcoat: 0,
    sheen: 1,
    sheenRoughness: 0.5,
    sheenColor: tint.clone().lerp(new THREE.Color(0xffffff), velvet),
  })
}

// what shines on its own: the green light, the REC light
export function glow(color: THREE.ColorRepresentation, intensity = 1.4) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity })
}

export function mesh(geometry: THREE.BufferGeometry, mat: THREE.Material, { position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0] }: Placement = {}) {
  const object = new THREE.Mesh(geometry, mat)
  object.position.set(...position)
  object.scale.set(...scale)
  object.rotation.set(...rotation)
  return object
}

export const sphere = new THREE.SphereGeometry(1, 48, 36)

// the depth of an ellipsoid's front surface at (x, y): where a painted-on feature has to sit to show
export function frontZ([[rx, ry, rz], [cx, cy, cz]]: Ellipsoid, x: number, y: number) {
  const nx = (x - cx) / rx
  const ny = (y - cy) / ry
  return cz + rz * Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))
}

// lays a flat thing (a plaster) on the front of an ellipsoid at (x, y), facing out along the surface
export function onSurface<T extends THREE.Object3D>(object: T, ellipsoid: Ellipsoid, x: number, y: number, lift = 0.01) {
  const [[rx, ry, rz], [cx, cy, cz]] = ellipsoid
  const z = frontZ(ellipsoid, x, y)
  const normal = new THREE.Vector3((x - cx) / (rx * rx), (y - cy) / (ry * ry), (z - cz) / (rz * rz)).normalize()
  object.position.set(x, y, z).addScaledVector(normal, lift)
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
  return object
}

// where each eye sits at rest, so a look can move them and bring them back
const EYE_REST = new WeakMap<THREE.Object3D, THREE.Vector3>()

// two glossy eyes with a catch-light each, returned so a look can blink, narrow or move them
export function addEyes(parent: THREE.Object3D, { x, y, z, size }: { x: number; y: number; z: number; size: number }) {
  // (one pupil and one gleam for both eyes)
  const pupil = material(0x10131c, { roughness: 0.15, clearcoat: 1 })
  const gleam = new THREE.MeshBasicMaterial({ color: 0xffffff })
  return [-1, 1].map((side) => {
    const eye = new THREE.Group()
    eye.position.set(side * x, y, z)
    EYE_REST.set(eye, eye.position.clone())
    eye.add(mesh(sphere, pupil, { scale: [size, size * 1.3, size * 0.7] }))
    eye.add(mesh(sphere, gleam, { position: [-size * 0.3, size * 0.45, size * 0.62], scale: [size * 0.32, size * 0.32, size * 0.2] }))
    parent.add(eye)
    return eye
  })
}

// how open each eye is (1: wide, near 0: a flat line), and where they look (dx, dy)
export function setEyes(eyes: THREE.Object3D[], { open = 1, left = open, right = open, dx = 0, dy = 0 }: { open?: number; left?: number; right?: number; dx?: number; dy?: number } = {}) {
  eyes.forEach((eye, index) => {
    const rest = EYE_REST.get(eye)
    eye.scale.y = index === 0 ? left : right
    if (rest) eye.position.set(rest.x + dx, rest.y + dy, rest.z)
  })
}

// the smile, returned so a look can swap it for another mouth
export function addSmile(parent: THREE.Object3D, { y, z, radius }: { y: number; z: number; radius: number }) {
  const smile = mesh(new THREE.TorusGeometry(radius, radius * 0.16, 12, 32, Math.PI), material(INK), { position: [0, y, z], rotation: [0, 0, Math.PI] })
  parent.add(smile)
  return smile
}

export function addCheeks(parent: THREE.Object3D, { x, y, z, size, tilt = 0, color = 0xff8a94 }: { x: number; y: number; z: number; size: number; tilt?: number; color?: number }) {
  const pink = material(color, { transparent: true, opacity: 0.75, roughness: 0.8, clearcoat: 0 })
  for (const side of [-1, 1]) {
    parent.add(mesh(sphere, pink, { position: [side * x, y, z], scale: [size, size * 0.6, size * 0.25], rotation: [0, side * tilt, 0] }))
  }
}

function canvas2d(width: number, height: number) {
  const canvas = Object.assign(document.createElement('canvas'), { width, height })
  return { canvas, context: canvas.getContext('2d')! }
}

// a word printed on a part (the « TEC » on the ticket's stub)
export function labelTexture(text: string, background: string, ink: string) {
  const { canvas, context } = canvas2d(256, 128)
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

// a sign floating in the air (a sum while it thinks, a « z » while it sleeps): white, outlined, facing the viewer
export function sign(text: string, outline: string, size = 0.42) {
  const { canvas, context } = canvas2d(128, 128)
  context.font = '800 96px -apple-system, system-ui, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.lineWidth = 18
  context.lineJoin = 'round'
  context.strokeStyle = outline
  context.strokeText(text, 64, 70)
  context.fillStyle = '#ffffff'
  context.fillText(text, 64, 70)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }))
  sprite.scale.setScalar(size)
  return sprite
}

// a soft round glow, facing the viewer (behind the green light)
export function halo(color: string) {
  const { canvas, context } = canvas2d(128, 128)
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
}

// the soft shadow under whoever stands on stage
export function blobShadow() {
  const { canvas, context } = canvas2d(128, 128)
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(10,12,20,.32)')
  gradient.addColorStop(1, 'rgba(10,12,20,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const shadow = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })
  return mesh(new THREE.PlaneGeometry(1.9, 1.9), shadow, { position: [0, -1.12, 0], rotation: [-Math.PI / 2, 0, 0], scale: [1, 0.45, 1] })
}
