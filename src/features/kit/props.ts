import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { glow, halo, labelTexture, material, mesh, sphere, type Vec3 } from './parts'

// What Pousse wears or holds, one thing per message (see looks.ts): the ticket (the plan), a camera (the video), a
// paper plane (the PR), a green light (Claude waits for your go), a magnifying glass (the
// audit), a plaster (red CI), a speech bubble (a comment on your PR), a backpack far too big (a heavy session),
// reading glasses (a review asked of you), a grey cloud (Kit's server no longer answers). Props keep their gloss:
// only Pousse himself is soft.

const DARK = 0x2b2f3a

// a rod from a to b: a strap, a temple of the glasses
function rod(a: THREE.Vector3, b: THREE.Vector3, radius: number, mat: THREE.Material) {
  const length = a.distanceTo(b)
  const object = new THREE.Mesh(new THREE.CapsuleGeometry(radius, Math.max(0.001, length - radius * 2), 4, 12), mat)
  object.position.copy(a).add(b).multiplyScalar(0.5)
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
  return object
}

export function ticket() {
  const prop = new THREE.Group()
  const gold = material(0xffc93d)
  prop.add(mesh(new RoundedBoxGeometry(0.5, 0.34, 0.08, 4, 0.04), gold, { position: [-0.06, 0, 0] }))
  prop.add(mesh(new RoundedBoxGeometry(0.16, 0.34, 0.08, 4, 0.04), gold, { position: [0.27, 0, 0] }))
  // the perforated line, then the stub
  const hole = material(0xd99a12)
  for (let i = 0; i < 5; i++) prop.add(mesh(sphere, hole, { position: [0.19, -0.12 + i * 0.06, 0.045], scale: [0.012, 0.012, 0.01] }))
  prop.add(mesh(new THREE.PlaneGeometry(0.26, 0.1), new THREE.MeshStandardMaterial({ map: labelTexture('TEC', '#ffc93d', '#9a5b00'), roughness: 0.6 }), { position: [-0.06, 0, 0.045] }))
  return prop
}

export function camera() {
  const prop = new THREE.Group()
  prop.add(mesh(new RoundedBoxGeometry(0.5, 0.34, 0.3, 4, 0.07), material(0x3a3d4a)))
  prop.add(mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.1, 32), material(0xd5d9e2, { metalness: 0.6, roughness: 0.3 }), { position: [0, 0, 0.18], rotation: [Math.PI / 2, 0, 0] }))
  prop.add(mesh(sphere, material(0x141826, { roughness: 0.05, clearcoat: 1 }), { position: [0, 0, 0.23], scale: [0.09, 0.09, 0.04] }))
  // the REC light, and the two reels on top
  prop.add(mesh(sphere, glow(0xff2a2a, 1.2), { position: [0.17, 0.11, 0.15], scale: [0.03, 0.03, 0.03] }))
  for (const x of [-0.12, 0.13]) prop.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 24), material(0x2a2c33), { position: [x, 0.27, 0], rotation: [0, 0, Math.PI / 2] }))
  return prop
}

export function plane() {
  const prop = new THREE.Group()
  const triangles = (points: Vec3[], color: number) => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3))
    geometry.computeVertexNormals()
    return new THREE.Mesh(geometry, material(color, { side: THREE.DoubleSide, roughness: 0.55, clearcoat: 0.1 }))
  }
  const nose: Vec3 = [0.55, 0, 0]
  const back: Vec3 = [-0.4, 0, 0]
  // two wings, flat and wide; a darker keel under them; a crease down the middle, so the folds read
  prop.add(triangles([nose, [-0.45, 0.04, 0.34], back], 0xf4f8ff))
  prop.add(triangles([nose, back, [-0.45, 0.04, -0.34]], 0xf4f8ff))
  prop.add(triangles([nose, back, [-0.36, -0.16, 0]], 0xb9c8e3))
  prop.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.95, 6), material(0x8fa3c7), { position: [0.07, 0.005, 0], rotation: [0, 0, Math.PI / 2] }))
  return prop
}

// a little traffic light with a single lamp, lit green, a visor above it; its glow pulses (see looks-moods.ts)
export function greenLight() {
  const prop = new THREE.Group()
  prop.add(mesh(new RoundedBoxGeometry(0.3, 0.3, 0.12, 4, 0.08), material(DARK)))
  prop.add(mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 24, Math.PI), material(DARK), { position: [0, 0.03, 0.09], rotation: [-0.5, 0, 0] }))
  const lamp = glow(0x3ddc84, 1.4)
  prop.add(mesh(sphere, lamp, { position: [0, 0, 0.06], scale: [0.1, 0.1, 0.05] }))
  const light = halo('rgba(80,230,140,0.9)')
  light.position.set(0, 0, 0.1)
  light.scale.setScalar(0.7)
  prop.add(light)
  return { prop, lamp, light }
}

// a magnifying glass: a wooden handle, a dark rim, a pale lens that catches the light
export function magnifier() {
  const prop = new THREE.Group()
  prop.add(mesh(new THREE.CapsuleGeometry(0.045, 0.24, 6, 12), material(0x9a6138), { position: [0, 0.05, 0] }))
  prop.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16), material(DARK), { position: [0, 0.22, 0] }))
  prop.add(mesh(new THREE.TorusGeometry(0.22, 0.035, 12, 40), material(DARK), { position: [0, 0.48, 0] }))
  prop.add(mesh(sphere, material(0xdff3ff, { transparent: true, opacity: 0.35, roughness: 0.05, clearcoat: 1 }), { position: [0, 0.48, 0], scale: [0.21, 0.21, 0.03] }))
  return prop
}

// a plaster in a cross, red, with its pale pad in the middle
export function plaster() {
  const prop = new THREE.Group()
  const red = material(0xe5484d, { roughness: 0.6, clearcoat: 0.3 })
  const dot = material(0xb8343a)
  for (const angle of [0.6, -0.6]) {
    const strip = mesh(new RoundedBoxGeometry(0.4, 0.12, 0.025, 2, 0.012), red, { rotation: [0, 0, angle] })
    for (const x of [-0.14, 0.14]) for (const y of [-0.025, 0.025]) strip.add(mesh(sphere, dot, { position: [x, y, 0.013], scale: [0.008, 0.008, 0.004] }))
    prop.add(strip)
  }
  prop.add(mesh(new RoundedBoxGeometry(0.1, 0.1, 0.03, 2, 0.015), material(0xf7b0ae, { roughness: 0.7, clearcoat: 0 }), { position: [0, 0, 0.005], rotation: [0, 0, Math.PI / 4] }))
  return prop
}

// a speech bubble, white, its tail pointing at Pousse, three dots inside: someone writing
export function bubble(dot: number) {
  const prop = new THREE.Group()
  const white = material(0xffffff, { roughness: 0.35 })
  prop.add(mesh(sphere, white, { scale: [0.38, 0.27, 0.1] }))
  prop.add(mesh(new THREE.ConeGeometry(0.08, 0.2, 16), white, { position: [0.2, -0.24, 0], rotation: [0, 0, 0.75], scale: [1, 1, 0.45] }))
  const dots = [-0.13, 0, 0.13].map((x) => {
    const object = mesh(sphere, material(dot), { position: [x, 0, 0.09], scale: [0.045, 0.045, 0.03] })
    prop.add(object)
    return object
  })
  return { prop, dots }
}

// a backpack far too big for it: a bulging body, a flap, side pockets, a bedroll strapped on top
export function backpack() {
  const prop = new THREE.Group()
  const canvas = material(0xc98a4b, { roughness: 0.75, clearcoat: 0.15 })
  const trim = material(0x8f5a2c, { roughness: 0.7, clearcoat: 0.1 })
  prop.add(mesh(new RoundedBoxGeometry(1.7, 1.85, 0.95, 6, 0.32), canvas))
  prop.add(mesh(new RoundedBoxGeometry(1.5, 0.55, 1.05, 4, 0.2), trim, { position: [0, 0.72, 0] }))
  for (const side of [-1, 1]) prop.add(mesh(new RoundedBoxGeometry(0.3, 0.7, 0.6, 4, 0.12), trim, { position: [side * 0.9, -0.35, 0] }))
  const roll = material(0xe9dcc3, { roughness: 0.8, clearcoat: 0 })
  prop.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.55, 24), roll, { position: [0, 1.12, 0.05], rotation: [0, 0, Math.PI / 2] }))
  for (const x of [-0.45, 0.45]) prop.add(mesh(new THREE.TorusGeometry(0.235, 0.025, 8, 24), trim, { position: [x, 1.12, 0.05], rotation: [0, Math.PI / 2, 0] }))
  return { prop, trim }
}

// the backpack's two straps, from the top of its shoulders down its front; surface(x, y) is the body's depth there
export function straps(mat: THREE.Material, surface: (x: number, y: number) => number) {
  const group = new THREE.Group()
  for (const side of [-1, 1]) {
    const top = new THREE.Vector3(side * 0.5, 0.72, 0)
    top.z = surface(top.x, top.y) + 0.03
    const middle = new THREE.Vector3(side * 0.66, 0.2, 0)
    middle.z = surface(middle.x, middle.y) + 0.04
    const bottom = new THREE.Vector3(side * 0.62, -0.32, 0)
    bottom.z = surface(bottom.x, bottom.y) + 0.04
    group.add(rod(top, middle, 0.05, mat), rod(middle, bottom, 0.05, mat))
  }
  return group
}

// reading glasses: two round frames over the eyes, a bridge, the temples going back over its sides
export function glasses(eyeX: number, eyeY: number, z: number) {
  const prop = new THREE.Group()
  const frame = material(0x3b2a24, { roughness: 0.3 })
  const lens = material(0xeaf6ff, { transparent: true, opacity: 0.22, roughness: 0.05, clearcoat: 1 })
  for (const side of [-1, 1]) {
    prop.add(mesh(new THREE.TorusGeometry(0.17, 0.025, 10, 36), frame, { position: [side * eyeX, eyeY, z], rotation: [0, side * 0.25, 0] }))
    prop.add(mesh(sphere, lens, { position: [side * eyeX, eyeY, z], scale: [0.16, 0.16, 0.015], rotation: [0, side * 0.25, 0] }))
    prop.add(rod(new THREE.Vector3(side * (eyeX + 0.16), eyeY + 0.03, z - 0.05), new THREE.Vector3(side * 0.86, eyeY + 0.06, 0.1), 0.018, frame))
  }
  prop.add(mesh(new THREE.TorusGeometry(0.07, 0.02, 8, 16, Math.PI), frame, { position: [0, eyeY + 0.02, z + 0.02] }))
  return prop
}

// a small grey cloud, puffy
export function cloud() {
  const prop = new THREE.Group()
  const grey = material(0xaab0ba, { roughness: 0.8, clearcoat: 0.1 })
  for (const [x, y, r] of [[-0.22, 0, 0.17], [0, 0.07, 0.22], [0.22, 0, 0.16], [0.08, -0.06, 0.15], [-0.1, -0.06, 0.14]] as const) {
    prop.add(mesh(sphere, grey, { position: [x, y, 0], scale: [r, r * 0.9, r * 0.8] }))
  }
  return prop
}
