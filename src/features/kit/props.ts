import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { labelTexture, material, mesh, sphere } from './parts'

// What Pousse holds, one thing per step of a ticket: the ticket (the plan), a camera (the video), a toolbox (the
// audit), a paper plane (the PR, sent out for review: so that it never reads as the plan's ticket).

const metal = () => material(0xd5d9e2, { metalness: 0.7, roughness: 0.25 })

function ticket() {
  const prop = new THREE.Group()
  const gold = material(0xffc93d)
  prop.add(mesh(new RoundedBoxGeometry(0.5, 0.34, 0.08, 4, 0.04), gold, { position: [-0.06, 0, 0] }))
  prop.add(mesh(new RoundedBoxGeometry(0.16, 0.34, 0.08, 4, 0.04), gold, { position: [0.27, 0, 0] }))
  // the perforated line, then the stub
  for (let i = 0; i < 5; i++) prop.add(mesh(sphere, material(0xd99a12), { position: [0.19, -0.12 + i * 0.06, 0.045], scale: [0.012, 0.012, 0.01] }))
  prop.add(mesh(new THREE.PlaneGeometry(0.26, 0.1), new THREE.MeshStandardMaterial({ map: labelTexture('TEC', '#ffc93d', '#9a5b00'), roughness: 0.6 }), { position: [-0.06, 0, 0.045] }))
  return prop
}

function camera() {
  const prop = new THREE.Group()
  prop.add(mesh(new RoundedBoxGeometry(0.5, 0.34, 0.3, 4, 0.07), material(0x3a3d4a)))
  prop.add(mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.1, 32), material(0xd5d9e2, { metalness: 0.6, roughness: 0.3 }), { position: [0, 0, 0.18], rotation: [Math.PI / 2, 0, 0] }))
  prop.add(mesh(sphere, material(0x141826, { roughness: 0.05, clearcoat: 1 }), { position: [0, 0, 0.23], scale: [0.09, 0.09, 0.04] }))
  // the REC light, and the two reels on top
  prop.add(mesh(sphere, new THREE.MeshStandardMaterial({ color: 0xff2a2a, emissive: 0xff2a2a, emissiveIntensity: 1.2 }), { position: [0.17, 0.11, 0.15], scale: [0.03, 0.03, 0.03] }))
  for (const x of [-0.12, 0.13]) prop.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 24), material(0x2a2c33), { position: [x, 0.27, 0], rotation: [0, 0, Math.PI / 2] }))
  return prop
}

function toolbox() {
  const prop = new THREE.Group()
  const steel = metal()
  prop.add(mesh(new RoundedBoxGeometry(0.56, 0.3, 0.3, 4, 0.06), material(0xf0524a), { position: [0, -0.04, 0] }))
  prop.add(mesh(new RoundedBoxGeometry(0.6, 0.07, 0.33, 4, 0.03), material(0xc93a33), { position: [0, 0.13, 0] }))
  prop.add(mesh(new THREE.TorusGeometry(0.1, 0.022, 8, 24, Math.PI), material(0x31343f), { position: [0, 0.17, 0] }))
  // the latch faces the viewer: it tells the box's front
  prop.add(mesh(new RoundedBoxGeometry(0.09, 0.06, 0.03, 2, 0.01), steel, { position: [0, 0.09, 0.17] }))
  // a wrench and a pencil sticking out of the lid: tools, at a glance
  const wrench = new THREE.Group()
  wrench.position.set(-0.17, 0.3, -0.02)
  wrench.rotation.z = 0.3
  wrench.add(mesh(new THREE.CapsuleGeometry(0.022, 0.18, 4, 8), steel))
  wrench.add(mesh(new THREE.TorusGeometry(0.05, 0.022, 8, 16, Math.PI * 1.45), steel, { position: [0, 0.14, 0], rotation: [0, 0, -Math.PI * 1.225] }))
  prop.add(wrench)
  const pencil = new THREE.Group()
  pencil.position.set(0.16, 0.27, -0.02)
  pencil.rotation.z = -0.28
  pencil.add(mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.22, 6), material(0xffc93d)))
  pencil.add(mesh(new THREE.ConeGeometry(0.028, 0.07, 6), material(0xf2d3a8), { position: [0, 0.145, 0] }))
  prop.add(pencil)
  return prop
}

function plane() {
  const prop = new THREE.Group()
  const triangles = (points: number[][], color: number) => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3))
    geometry.computeVertexNormals()
    return new THREE.Mesh(geometry, material(color, { side: THREE.DoubleSide, roughness: 0.55, clearcoat: 0.1 }))
  }
  const nose = [0.55, 0, 0]
  const back = [-0.4, 0, 0]
  // two wings, flat and wide, seen from above; a darker keel under them; a crease down the middle
  prop.add(triangles([nose, [-0.45, 0.04, 0.34], back], 0xf4f8ff))
  prop.add(triangles([nose, back, [-0.45, 0.04, -0.34]], 0xf4f8ff))
  prop.add(triangles([nose, back, [-0.36, -0.16, 0]], 0xb9c8e3))
  prop.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.95, 6), material(0x8fa3c7), { position: [0.07, 0.005, 0], rotation: [0, 0, Math.PI / 2] }))
  return prop
}

export const PROPS = { ticket, camera, toolbox, plane }
export type Prop = keyof typeof PROPS
// where each goes: in the raised hand, or (too big to hold) at Pousse's feet
export const HOLD: Record<Prop, { position: number[]; rotation: number[]; scale: number }> = {
  ticket: { position: [1.05, 0.5, 0.5], rotation: [0, -0.3, -0.12], scale: 1.05 },
  camera: { position: [0.78, 0.08, 0.62], rotation: [0.1, -0.35, -0.08], scale: 1 },
  plane: { position: [0.95, 0.72, 0.45], rotation: [0.75, -0.55, 0.45], scale: 1.2 },
  toolbox: { position: [0.72, -0.8, 0.68], rotation: [0.08, -0.18, 0], scale: 1.6 },
}
